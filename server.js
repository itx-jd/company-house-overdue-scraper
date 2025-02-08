const express = require('express');
const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle JSON body
app.use(express.json());
app.use(express.static('public'));

// Ensure the reports directory exists
const reportsDir = path.join(__dirname, 'reports');
function ensureReportsDirExists() {
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true }); // Ensures the directory is created
        console.log('Reports directory created.');
    }
}

// Function to base64 encode the API key
function encodeApiKey(apiKey) {
    return Buffer.from(apiKey + ':').toString('base64');
}

// Your API Key
const apiKey = 'your-api-key-here';
const encodedApiKey = encodeApiKey(apiKey);

// Function to check if a company has an overdue confirmation statement and other details
async function checkCompanyOverdueStatus(companyNumber) {
    try {
        const profileResponse = await axios.get(`https://api.company-information.service.gov.uk/company/${companyNumber}`, {
            headers: { 'Authorization': `Basic ${encodedApiKey}` }
        });
        const profile = profileResponse.data;

        const registeredOfficeAddress = profile.registered_office_address;
        const formattedAddress = `${registeredOfficeAddress.address_line_1}, ${registeredOfficeAddress.locality}, ${registeredOfficeAddress.country}, ${registeredOfficeAddress.postal_code}`;

        const confirmationStatement = profile.confirmation_statement;
        const accounts = profile.accounts;

        if (confirmationStatement && (confirmationStatement.overdue || accounts.next_accounts.overdue)) {
            const officerData = await getCompanyOfficers(companyNumber);
            return {
                Name: profile.company_name,
                Number: profile.company_number,
                Company_Type: profile.type,
                Registered_Office_Address: formattedAddress,
                Confirmation_Statement_Overdue: confirmationStatement ? (confirmationStatement.overdue ? 'Yes' : 'No') : 'N/A',
                Confirmation_next_due: confirmationStatement ? confirmationStatement.next_due : 'N/A',
                Confirmation_next_made_up_to: confirmationStatement ? confirmationStatement.next_made_up_to : 'N/A',
                Accounts_Overdue: accounts ? (accounts.next_accounts.overdue ? 'Yes' : 'No') : 'N/A',
                Accounts_next_due: accounts ? accounts.next_due : 'N/A',
                Accounts_next_made_up_to: accounts ? accounts.next_made_up_to : 'N/A',
                ...officerData
            };
        } else {
            return null;
        }

    } catch (error) {
        console.error(`Error fetching data for company ${companyNumber}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

// Function to delete old reports
function deleteOldReports() {
    fs.readdir(reportsDir, (err, files) => {
        if (err) {
            console.error('Error reading reports directory:', err);
            return;
        }

        // Loop through the files and delete each one
        files.forEach(file => {
            const filePath = path.join(reportsDir, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file}:`, err);
                } else {
                    console.log(`Deleted old report: ${file}`);
                }
            });
        });
    });
}

// Function to get company officers' details
async function getCompanyOfficers(companyNumber) {
    try {
        const officersResponse = await axios.get(`https://api.company-information.service.gov.uk/company/${companyNumber}/officers`, {
            headers: { 'Authorization': `Basic ${encodedApiKey}` }
        });
        const officers = officersResponse.data.items;

        if (officers.length > 0) {
            const officer = officers[0]; // Assuming we only need the first officer
            return {
                Officer_Name: officer.name,
                Nationality: officer.nationality,
                Occupation: officer.occupation,
                Officer_Role: officer.officer_role,
                Country_of_Residence: officer.country_of_residence
            };
        } else {
            return {
                Officer_Name: 'N/A',
                Nationality: 'N/A',
                Occupation: 'N/A',
                Officer_Role: 'N/A',
                Country_of_Residence: 'N/A'
            };
        }
    } catch (error) {
        console.error(`Error fetching officers for company ${companyNumber}:`, error.response ? error.response.data : error.message);
        return {
            Officer_Name: 'N/A',
            Nationality: 'N/A',
            Occupation: 'N/A',
            Officer_Role: 'N/A',
            Country_of_Residence: 'N/A'
        };
    }
}

// Function to get overdue companies and create an XLSX file
async function getOverdueCompanies(req, res) {
    const { incorporatedFrom, incorporatedTo, volume } = req.body;

    // Input Validation
    if (volume < 0) {
        return res.status(400).json({ status: 'error', message: 'Volume cannot be negative.' });
    }

    if (new Date(incorporatedTo) < new Date(incorporatedFrom)) {
        return res.status(400).json({ status: 'error', message: '"Incorporated To" date cannot be less than "Incorporated From" date.' });
    }

    // Delete old reports before generating a new one
    deleteOldReports();

    const searchUrl = `https://api.company-information.service.gov.uk/advanced-search/companies?incorporated_from=${incorporatedFrom}&incorporated_to=${incorporatedTo}&size=${volume}`;

    try {
        const searchResponse = await axios.get(searchUrl, {
            headers: { 'Authorization': `Basic ${encodedApiKey}` }
        });

        const companies = searchResponse.data.items;
        const overdueCompanies = [];
        console.log(`Found ${companies.length} companies`);

        for (let index = 0; index < companies.length; index++) {
            const company = companies[index];
            const companyNumber = company.company_number;

            console.log(`Checking company ${companyNumber} (${index + 1}/${companies.length})`);

            const overdueCompany = await checkCompanyOverdueStatus(companyNumber);
            if (overdueCompany) {
                overdueCompanies.push(overdueCompany);
            }
        }

        // Create a new workbook and append the overdue companies data
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(overdueCompanies);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Overdue Companies');

        // Ensure the reports directory exists
        ensureReportsDirExists(); // Check if directory exists before saving

        // Write the workbook to a new file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `OverDueReport_${timestamp}.xlsx`;
        const filePath = path.join(reportsDir, filename); // Using reportsDir

        XLSX.writeFile(workbook, filePath);

        console.log(`Data exported to ${filename}`);
        console.log(`Total number of rows now: ${overdueCompanies.length}`);

        // Return the file path and count to the client for download and display
        res.json({
            status: 'success',
            filename,
            overdueCount: overdueCompanies.length // Add overdueCount here
        });

    } catch (error) {
        console.error('Error generating overdue report:', error.response ? error.response.data : error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
}


// Endpoint to fetch companies and generate report
app.post('/search-companies', getOverdueCompanies);

// Serve the file download route
app.get('/download-report/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(reportsDir, filename); // Using reportsDir
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('File not found.');
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
