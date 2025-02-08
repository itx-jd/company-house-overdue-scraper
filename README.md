# 🚀 Company House Overdue Scraper

The **Company House Overdue Scraper** is a **web-based tool** to filter overdue companies registered in [**Companies House UK**](https://www.gov.uk/government/organisations/companies-house) and **export the data into an Excel file**. Perfect for businesses, accountants, and legal professionals to track overdue companies and monitor compliance effortlessly. 

---

### 🌟 Key Features:
- **Filter Overdue Companies** based on confirmation statements and accounts.
- **User-Friendly Interface** with no coding required.
- **Downloadable Excel Report** with company details.
- **Real-Time Data** from Companies House UK’s API. 

---

### 💡 How It Works:
1. **Set Filters**: Choose your criteria (incorporation dates, volume).
2. **Scrape Data**: Fetch overdue company details from Companies House.
3. **Download Report**: Export the data to an Excel file.


### 🖼️ Screenshot:

![Web Interface Screenshot](https://your-screenshot-link.com)

---

### 🔑 How to Get Your API Key:
To access the **Companies House API**, you need an API key. You can obtain it by following these simple steps:
1. Visit the [Companies House Developer Hub](https://developer.company-information.service.gov.uk/overview).
2. Sign up or log in to your account.
3. Once logged in, you can generate your API key and start using the API in your projects.

---

### 🔧 Project Setup & Installation:

To get started with **Company House Overdue Scraper**, follow these simple steps:

#### 1️⃣ Clone the Repository:
Clone this repository to your local machine using Git:

```bash
git clone https://github.com/itx-jd/company-house-overdue-scraper.git
```

### 2️⃣ Install Dependencies:
Navigate to the project folder and install all required dependencies:

```bash
cd company-house-overdue-scraper
npm install
```

### 3️⃣ API Key Configuration:
1. Open the server.js file in a text editor.
2. Find the following line:
```bash
const apiKey = 'your-api-key-here';
```
3. Replace `your-api-key-her` with your actual API key that you can obtain from the Companies House Developer Portal.

### 4️⃣ Run the Application:
Once you’ve configured the API key, start the application by running:
```bash
npm start
```

This will start the server at `http://localhost:3000`. You can now use the web interface to search for overdue companies and generate the report! 🎉

