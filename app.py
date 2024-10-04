from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import requests
import base64
import openpyxl
from datetime import datetime
import shutil

app = Flask(__name__)

# Route to serve the HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Ensure the reports directory exists
reports_dir = os.path.join(os.getcwd(), 'reports')
if not os.path.exists(reports_dir):
    os.makedirs(reports_dir)

# API Key and Authorization
api_key = '147b05b2-1db0-4c76-9dcd-2309091ad3fc'
encoded_api_key = base64.b64encode((api_key + ':').encode('utf-8')).decode('utf-8')


# Function to check if a company has overdue confirmation statement
def check_company_overdue_status(company_number):
    try:
        profile_url = f'https://api.company-information.service.gov.uk/company/{company_number}'
        profile_response = requests.get(profile_url, headers={'Authorization': f'Basic {encoded_api_key}'})
        profile_response.raise_for_status()
        profile = profile_response.json()

        registered_office_address = profile.get('registered_office_address', {})
        formatted_address = f"{registered_office_address.get('address_line_1', '')}, " \
                            f"{registered_office_address.get('locality', '')}, " \
                            f"{registered_office_address.get('country', '')}, " \
                            f"{registered_office_address.get('postal_code', '')}"

        confirmation_statement = profile.get('confirmation_statement', {})
        accounts = profile.get('accounts', {})

        if confirmation_statement.get('overdue') or accounts.get('next_accounts', {}).get('overdue'):
            officer_data = get_company_officers(company_number)
            return {
                'Name': profile['company_name'],
                'Number': profile['company_number'],
                'Company_Type': profile['type'],
                'Registered_Office_Address': formatted_address,
                'Confirmation_Statement_Overdue': 'Yes' if confirmation_statement.get('overdue') else 'No',
                'Confirmation_next_due': confirmation_statement.get('next_due', 'N/A'),
                'Confirmation_next_made_up_to': confirmation_statement.get('next_made_up_to', 'N/A'),
                'Accounts_Overdue': 'Yes' if accounts.get('next_accounts', {}).get('overdue') else 'No',
                'Accounts_next_due': accounts.get('next_due', 'N/A'),
                'Accounts_next_made_up_to': accounts.get('next_made_up_to', 'N/A'),
                **officer_data
            }
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for company {company_number}: {e}")
        return None


# Function to get company officers
def get_company_officers(company_number):
    try:
        officers_url = f'https://api.company-information.service.gov.uk/company/{company_number}/officers'
        officers_response = requests.get(officers_url, headers={'Authorization': f'Basic {encoded_api_key}'})
        officers_response.raise_for_status()
        officers = officers_response.json().get('items', [])

        if officers:
            officer = officers[0]
            return {
                'Officer_Name': officer.get('name', 'N/A'),
                'Nationality': officer.get('nationality', 'N/A'),
                'Occupation': officer.get('occupation', 'N/A'),
                'Officer_Role': officer.get('officer_role', 'N/A'),
                'Country_of_Residence': officer.get('country_of_residence', 'N/A')
            }
        return {
            'Officer_Name': 'N/A',
            'Nationality': 'N/A',
            'Occupation': 'N/A',
            'Officer_Role': 'N/A',
            'Country_of_Residence': 'N/A'
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching officers for company {company_number}: {e}")
        return {
            'Officer_Name': 'N/A',
            'Nationality': 'N/A',
            'Occupation': 'N/A',
            'Officer_Role': 'N/A',
            'Country_of_Residence': 'N/A'
        }


# Delete old reports
def delete_old_reports():
    for filename in os.listdir(reports_dir):
        file_path = os.path.join(reports_dir, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)


@app.route('/search-companies', methods=['POST'])
def get_overdue_companies():
    data = request.json
    incorporated_from = data['incorporatedFrom']
    incorporated_to = data['incorporatedTo']
    volume = int(data['volume'])  # Convert volume to integer

    # Validation
    if volume < 0:
        return jsonify({'status': 'error', 'message': 'Volume cannot be negative.'}), 400
    if datetime.strptime(incorporated_to, '%Y-%m-%d') < datetime.strptime(incorporated_from, '%Y-%m-%d'):
        return jsonify({'status': 'error', 'message': '"Incorporated To" date cannot be less than "Incorporated From" date.'}), 400

    # Delete old reports
    delete_old_reports()

    search_url = f'https://api.company-information.service.gov.uk/advanced-search/companies?incorporated_from={incorporated_from}&incorporated_to={incorporated_to}&size={volume}'

    try:
        search_response = requests.get(search_url, headers={'Authorization': f'Basic {encoded_api_key}'})
        search_response.raise_for_status()

        companies = search_response.json().get('items', [])
        overdue_companies = []

        for index, company in enumerate(companies):
            company_number = company['company_number']
            overdue_company = check_company_overdue_status(company_number)
            if overdue_company:
                overdue_companies.append(overdue_company)

        # Create a new Excel file with the results
        filename = f'OverDueReport_{datetime.now().strftime("%Y-%m-%d_%H-%M-%S")}.xlsx'
        file_path = os.path.join(reports_dir, filename)

        wb = openpyxl.Workbook()
        ws = wb.active
        
        if overdue_companies:  # Check if overdue_companies is not empty
            ws.append(list(overdue_companies[0].keys()))  # Header row

            for company in overdue_companies:
                ws.append(list(company.values()))
        else:
            # If no overdue companies, append an appropriate message or leave empty
            ws.append(["No overdue companies found"])

        wb.save(file_path)

        return jsonify({
            'status': 'success',
            'filename': filename,
            'overdueCount': len(overdue_companies)
        })

    except requests.exceptions.RequestException as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500



# Serve the file for download
@app.route('/download-report/<filename>', methods=['GET'])
def download_report(filename):
    return send_from_directory(reports_dir, filename, as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True, port=3000)
