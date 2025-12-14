
# AI-Powered Timetable Generator

An intelligent timetable scheduling system that uses a Genetic Algorithm to generate conflict-free, optimized schedules for colleges and universities.

## 🚀 Features

- 🧬 Genetic Algorithm–based timetable generation  
- 📚 Support for multiple batches, semesters, and courses  
- 👨‍🏫 Faculty workload limits and expertise mapping  
- 🎓 Student course preferences and choice-based credit system  
- 🧩 Hard and soft constraint handling (no clashes, workload balance, etc.)  
- 📅 Timetable view with filters (by batch, faculty, semester, student)  
- 💾 Save and load generated timetables  
- 📄 Optional PDF export for sharing and printing  
- 🌐 Clean web interface with separate frontend and backend

## 🧱 Tech Stack

- **Backend:** Python, Flask, Flask-CORS  
- **Algorithm:** Custom Genetic Algorithm  
- **Database:** SQLite  
- **Frontend:** HTML, CSS, Vanilla JavaScript  
- **Other:** Faker (sample data), ReportLab (PDF export, if used)

## 📁 Project Structure

```text
AI-SEM-TB/
├── Backend/
│   ├── app.py                # Flask application entry point
│   ├── db.py                 # SQLite connection helper
│   ├── models.py             # Database access functions
│   ├── genetic_algo.py       # Genetic Algorithm implementation
│   ├── timetable_routes.py   # API routes for timetable operations
│   ├── seed_data.py          # Script to seed database with sample data
│   ├── utils.py              # Utility helpers
│   ├── timetable.db          # SQLite database file
│   └── requirements.txt      # Python dependencies
│
├── Frontend/
│   ├── templates/
│   │   ├── index.html        # Dashboard / home page
│   │   ├── timetables.html   # View generated timetables
│   │   ├── add_student.html  # Student registration form
│   │   └── add_faculty.html  # Faculty registration form
│   └── static/
│       ├── app.js            # Frontend logic & API calls
│       └── styles.css        # Styling
│
└── README.md                 # Project documentation
```

## 🔧 Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/AI-Powered-Timetable-Generator.git
cd AI-Powered-Timetable-Generator
```

### 2. Create and activate virtual environment

```bash
cd Backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate
```

### 3. Install dependencies

If you have `requirements.txt`:

```bash
pip install -r requirements.txt
```

Or manually:

```bash
pip install flask flask-cors faker reportlab
```

### 4. Initialize the database

```bash
python seed_data.py
```

This creates and populates `timetable.db` with sample batches, students, faculty, courses, etc.

### 5. Run the Flask server

```bash
python app.py
```

The app will start on:

```text
http://127.0.0.1:5000
```

## 💻 How to Use

1. Open the browser at `http://127.0.0.1:5000`.  
2. From the dashboard:
   - Use **Add Student** to register students and select their course preferences.  
   - Use **Add Faculty** to register teachers, workload limits, and courses they can teach.  
3. Click **Generate Timetable** to run the Genetic Algorithm and create an optimized schedule.  
4. Open the **Timetables** page to:
   - Filter timetables by semester, batch, faculty, or student.  
   - Review the generated weekly schedule.  
   - Optionally save or export timetables (if enabled).

## 🧬 Genetic Algorithm (High-Level)

The Genetic Algorithm works roughly as follows:

1. **Initial Population** – Generate a set of random valid timetables.  
2. **Fitness Evaluation** – Score each timetable based on constraints:
   - No overlapping classes for a faculty, batch, or classroom  
   - Faculty workload within limits  
   - Courses assigned to correct faculty expertise  
   - Student choices and semester structure respected  
3. **Selection** – Choose the best timetables based on fitness.  
4. **Crossover & Mutation** – Combine and slightly modify timetables to explore new possibilities.  
5. **Iterations** – Repeat evaluation and evolution for several generations and keep the best timetable found.

## 🧪 Useful Commands (Development)

```bash
# Run server (from Backend folder)
python app.py

# Re-seed database
python seed_data.py

# Freeze dependencies (optional)
pip freeze > requirements.txt
```

## ✅ Roadmap / Future Improvements

- User authentication (admin / faculty / student roles)  
- More advanced constraint configuration from UI  
- Better conflict explanations and manual editing of generated timetables  
- Dark mode and improved UI/UX  
- Deployment to cloud (Render, Railway, etc.)

## 👤 Author

**Sai Satya Sri Poluparthi**  
- GitHub: [@SaiSatyaSri52](https://github.com/SaiSatyaSri52)  
