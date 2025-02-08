# 🚀 Company House Overdue Scraper

**Company House Overdue Scraper** is a **web-based tool** that allows you to **filter overdue companies** registered in **Companies House UK** and **export the data into an Excel file**. This easy-to-use solution helps businesses, accountants, and legal professionals keep track of overdue companies and monitor compliance, all from a simple web interface. 🏢📈

---

### 🌟 Key Features:
- **Filter Overdue Companies**: Quickly scrape and filter companies with overdue confirmation statements and accounts.
- **Easy Web Interface**: No need for complex coding. Everything is accessible through a user-friendly web interface.
- **Downloadable Excel Report**: Once the data is filtered, the tool generates a downloadable Excel file with all the relevant company details. 📊📥
- **Real-Time Data**: Directly connects to Companies House UK’s API for accurate, up-to-date company information. 🔄

---

### 💡 How It Works:
1. **Configure the Filters**: Set your filters based on incorporation dates, volume, and other criteria.
2. **Scrape the Data**: The scraper connects to the Companies House API and pulls the overdue company details.
3. **Export the Report**: Once the data is fetched, the tool generates an Excel file that you can download and analyze. 📝💼

---

### 🖼️ Screenshot:

![Web Interface Screenshot](https://your-screenshot-link.com)

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

