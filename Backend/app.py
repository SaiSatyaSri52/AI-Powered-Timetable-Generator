from flask import Flask, render_template
from flask_cors import CORS
from timetable_routes import bp
import os

base_dir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__, static_folder='../frontend/static', template_folder='../frontend/templates')
CORS(app)
app.register_blueprint(bp)

@app.route('/')
def index():
    return render_template('index.html')


# New routes for separate data entry forms
@app.route('/add_student')
def add_student_form():
    return render_template('add_student.html')

@app.route('/add_faculty')
def add_faculty_form():
    return render_template('add_faculty.html')

# new route to serve the timetables page
@app.route('/timetables')
def timetables():
    return render_template('timetables.html')

if __name__ == "__main__":
    app.run(debug=True)
