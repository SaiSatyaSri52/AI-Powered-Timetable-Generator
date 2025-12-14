const BASE_URL = "http://127.0.0.1:5000";

// Global data stores (can be accessed globally for form population/display)
let batches = [];
let students = [];
let faculty = [];
let courses = [];
let semesters = [];
let allSavedTimetables = []; // New store for loaded timetable list

// Global element refs for the timetable view
let timetableContainer, timetableTitle, fitnessScoreDiv;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Setup modal event listeners (needed on all pages)
    setupModalEventListeners();
    
    // 2. Determine which page we are on
    const currentPath = window.location.pathname;
    const isTimetablePage = currentPath.includes('/timetables');
    const isIndexPage = currentPath === '/';
    const isStudentPage = currentPath.includes('/add_student');
    const isFacultyPage = currentPath.includes('/add_faculty');
    
    // 3. Initialize data and components based on the page
    fetchDataAndPopulateForms().then(() => {
        if (isTimetablePage) {
            setupTimetablesPage();
        } else if (isIndexPage) {
            setupIndexEventListeners();
        } else if (isStudentPage) {
            setupStudentPageEventListeners();
        } else if (isFacultyPage) {
            setupFacultyPageEventListeners();
        }
    });
});

// ----------------- Page Specific Setup -----------------

function setupIndexEventListeners() {
    // Only includes controls relevant to the main index page (Generate button)
    document.getElementById("generateBtn")?.addEventListener("click", handleGenerateTimetable);
}

function setupStudentPageEventListeners() {
    // Only runs on the /add_student page
    document.getElementById("studentForm")?.addEventListener("submit", handleAddStudent);
}

function setupFacultyPageEventListeners() {
    // Only runs on the /add_faculty page
    document.getElementById("facultyForm")?.addEventListener("submit", handleAddFaculty);
}

// ----------------- Core Data & Utility -----------------

// Fetches all necessary metadata for forms and filters
async function fetchDataAndPopulateForms() {
    try {
        const [batchesRes, coursesRes, facultyRes, studentsRes, semestersRes] = await Promise.all([
            fetch(`${BASE_URL}/api/get_batches`),
            fetch(`${BASE_URL}/api/get_courses`),
            fetch(`${BASE_URL}/api/get_faculty`),
            fetch(`${BASE_URL}/api/get_students`),
            fetch(`${BASE_URL}/api/get_semesters`),
        ]);

        if (!batchesRes.ok || !coursesRes.ok || !facultyRes.ok || !studentsRes.ok || !semestersRes.ok) {
            throw new Error("One or more API endpoints failed to load.");
        }

        batches = await batchesRes.json();
        courses = await coursesRes.json();
        faculty = await facultyRes.json();
        students = await studentsRes.json();
        semesters = await semestersRes.json();

        // Populate menus for data entry (add_student.html / add_faculty.html)
        if (document.getElementById("student-batch-select")) {
            populateSelect("student-batch-select", batches, "batch_id", "batch_name");
            populateSelect("student-courses-select", courses, "course_id", "course_name");
        }
        if (document.getElementById("faculty-expertise-select")) {
            populateSelect("faculty-expertise-select", courses, "course_id", "course_name");
        }
        
        // Populate menus for filtering (timetables.html)
        if (document.getElementById("view-semester-select")) {
            populateSelect("view-semester-select", semesters, "semester_id", "semester_name", "All Semesters");
            populateSelect("view-faculty-select", faculty, "faculty_id", "faculty_name", "All Faculty");
            populateSelect("view-batch-select", batches, "batch_id", "batch_name", "All Batches");
            
            // view-student-select is only on timetables.html now
            if (document.getElementById("view-student-select")) {
                populateSelect("view-student-select", students, "student_id", "student_name", "All Students");
            }
        }

    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        showModal("Error", `Failed to load data. Backend may be down. Error: ${error.message}`);
    }
}

async function fetchBatchesBySemester(semesterId) {
    if (semesterId === "all") return batches;
    // Assuming you have a route for this, otherwise fall back to client-side filtering
    // Since we don't have this API route, we return all batches for now.
    return batches.filter(b => b.semester_id.toString() === semesterId.toString());
}

function populateSelect(selectId, data, valueKey, textKey, defaultOptionText = null) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return;

    selectElement.innerHTML = "";
    if (defaultOptionText) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "all";
        defaultOption.textContent = defaultOptionText;
        selectElement.appendChild(defaultOption);
    }

    data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
}

function showModal(title, message) {
    const messageModal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = message;
    messageModal.classList.remove('hidden');
}

function setupModalEventListeners() {
    document.getElementById("modal-ok-btn")?.addEventListener("click", () => {
        document.getElementById("message-modal").classList.add("hidden");
    });
    
    // Close Saved Timetables Modal
    document.getElementById("close-saved-modal-btn")?.addEventListener("click", () => {
        document.getElementById("saved-timetables-modal").classList.add("hidden");
    });

    // Handle Select All/None for Export
    document.getElementById("select-all-checkbox")?.addEventListener("change", (e) => {
        const checked = e.target.checked;
        const checks = document.querySelectorAll('#unified-timetables-list input[type="checkbox"]');
        checks.forEach(checkbox => {
            checkbox.checked = checked;
        });
        // Manually update export button state after changing all checkboxes
        updateExportButtonState();
    });
}

// ----------------- Form Handlers -----------------

async function handleAddStudent(e) {
    e.preventDefault();
    const studentData = {
        student_id: Date.now(),
        student_name: document.getElementById("student_name").value,
        batch_id: parseInt(document.getElementById("student-batch-select").value),
        course_choices: Array.from(document.getElementById("student-courses-select").selectedOptions).map((opt) =>
            parseInt(opt.value)
        ),
    };
    try {
        const response = await fetch(`${BASE_URL}/api/add_student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unknown server error.");
        showModal("Success", result.message);
        e.target.reset();
        await fetchDataAndPopulateForms(); // Re-populate menus to reflect new data
    } catch (error) {
        console.error("Add Student Error:", error);
        showModal("Error", `Failed to add student: ${error.message}`);
    }
}

async function handleAddFaculty(e) {
    e.preventDefault();
    const facultyData = {
        faculty_id: Date.now(),
        faculty_name: document.getElementById("faculty_name").value,
        workload_limit_hours: parseInt(document.getElementById("workload_limit_hours").value),
        expertise: Array.from(document.getElementById("faculty-expertise-select").selectedOptions).map((opt) =>
            parseInt(opt.value)
        ),
    };
    try {
        const response = await fetch(`${BASE_URL}/api/add_faculty`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(facultyData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unknown server error.");
        showModal("Success", result.message);
        e.target.reset();
        await fetchDataAndPopulateForms(); // Re-populate menus to reflect new data
    } catch (error) {
        console.error("Add Faculty Error:", error);
        showModal("Error", `Failed to add faculty: ${error.message}`);
    }
}

// ----------------- Timetable Generation Logic -----------------

async function handleGenerateTimetable() {
    const loadingDiv = document.getElementById("loading");
    loadingDiv.classList.remove("hidden");
    loadingDiv.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3 inline" viewBox="0 0 24 24"></svg><span>Generating optimal timetable... This may take a while.</span>';

    try {
        const response = await fetch(`${BASE_URL}/api/generate_optimal_timetable`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Unknown server error.");
        
        const timetableData = data.schedule_data;
        const timetableName = data.timetable_name;

        // 1. Store data temporarily in local storage
        localStorage.setItem('currentTimetableData', JSON.stringify(timetableData));
        localStorage.setItem('currentTimetableName', timetableName);

        // 2. Redirect to the display page
        window.location.href = `${BASE_URL}/timetables`;

    } catch (error) {
        console.error("Generation Error:", error);
        showModal("Error", `Failed to generate timetable: ${error.message}`);
    } finally {
        loadingDiv.classList.add("hidden");
    }
}

// ----------------- Saved Timetable Modal Logic -----------------

function updateExportButtonState() {
    const checks = document.querySelectorAll('#unified-timetables-list input[type="checkbox"]:checked');
    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) {
        exportBtn.disabled = checks.length === 0;
    }
}

async function fetchSavedTimetables() {
    try {
        const response = await fetch(`${BASE_URL}/api/get_saved_timetables`);
        if (!response.ok) throw new Error("Failed to fetch saved timetables.");
        allSavedTimetables = await response.json();
        return allSavedTimetables;
    } catch (error) {
        console.error("Error fetching saved timetables:", error);
        showModal("Error", `Could not load saved timetables: ${error.message}`);
        return [];
    }
}

function renderTimetablesList(timetables) {
    const listContainer = document.getElementById('unified-timetables-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (timetables.length === 0) {
        listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">No timetables have been saved yet.</p>';
        document.getElementById('select-all-checkbox').disabled = true;
        updateExportButtonState();
        return;
    }

    document.getElementById('select-all-checkbox').disabled = false;
    
    timetables.forEach(tt => {
        const timestamp = new Date(tt.timestamp).toLocaleString();
        const listItem = document.createElement('div');
        listItem.className = 'flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50 rounded-md transition duration-100';
        
        // Checkbox and Name/Timestamp
        listItem.innerHTML = `
            <div class="flex items-center space-x-3 w-4/5 cursor-pointer timetable-load-link" data-timetable-id="${tt.timetable_id}">
                <input type="checkbox" id="check-${tt.timetable_id}" data-id="${tt.timetable_id}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded timetable-check" onclick="event.stopPropagation(); updateExportButtonState();">
                <label for="check-${tt.timetable_id}" class="text-sm font-medium text-gray-800 truncate">${tt.timetable_name}</label>
            </div>
            <span class="text-xs text-gray-500">${timestamp}</span>
        `;
        
        listContainer.appendChild(listItem);
    });

    // Add click listener for loading (delegated via class)
    listContainer.querySelectorAll('.timetable-load-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent link action if checkbox or label was clicked directly
            if (e.target.closest('.timetable-check')) return;

            const timetableId = link.dataset.timetableId;
            handleLoadSpecificTimetable(timetableId);
        });
    });

    updateExportButtonState();
}

async function handleLoadTimetables() {
    document.getElementById("saved-timetables-modal").classList.remove("hidden");
    const listContainer = document.getElementById('unified-timetables-list');
    listContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Loading saved schedules...</p>';

    const timetables = await fetchSavedTimetables();
    renderTimetablesList(timetables);
}

async function handleLoadSpecificTimetable(timetableId) {
    document.getElementById("saved-timetables-modal").classList.add("hidden");
    try {
        const response = await fetch(`${BASE_URL}/api/get_timetable/${timetableId}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || "Failed to load specific timetable.");

        const selectedTimetable = allSavedTimetables.find(tt => tt.timetable_id.toString() === timetableId);
        const name = selectedTimetable ? selectedTimetable.timetable_name : `Timetable ID: ${timetableId}`;

        // Update the current timetable data and display
        setupTimetableEventListeners(data); // Important: Updates currentTimetableData
        displayTimetable(data, name);
        showModal("Success", `Timetable "${name}" loaded successfully!`);
    } catch (error) {
        console.error("Load Specific Timetable Error:", error);
        showModal("Error", `Failed to load timetable: ${error.message}`);
    }
}

async function handleExportTimetables() {
    const checks = document.querySelectorAll('#unified-timetables-list input[type="checkbox"]:checked');
    const ids = Array.from(checks).map(check => parseInt(check.dataset.id));

    if (ids.length === 0) {
        showModal("Error", "Please select at least one timetable to export.");
        return;
    }
    
    // Temporarily disable the button and show loading state
    const exportBtn = document.getElementById('exportPdfBtn');
    exportBtn.disabled = true;
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Generating PDF...';

    try {
        const response = await fetch(`${BASE_URL}/export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: ids, format: 'pdf' }),
        });

        if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || "PDF export failed on the server.");
        }

        // Trigger file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_timetables.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        document.getElementById("saved-timetables-modal").classList.add("hidden");
        showModal("Success", `Successfully exported ${ids.length} timetable(s) as PDF.`);

    } catch (error) {
        console.error("Export Error:", error);
        showModal("Error", `Export failed: ${error.message}`);
    } finally {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false; // Re-enable if checks are still present
        updateExportButtonState();
    }
}

// ----------------- Timetables Page Setup -----------------

async function setupTimetablesPage() {
    timetableContainer = document.getElementById("timetable-container");
    timetableTitle = document.getElementById("timetable-title");
    fitnessScoreDiv = document.getElementById("fitness-score");

    let dataToDisplay = [];
    let titleToDisplay = "Optimal Timetable (AI)";

    const tempTimetableData = localStorage.getItem('currentTimetableData');
    const tempTimetableName = localStorage.getItem('currentTimetableName');
    
    // 1. Check for temporary data (from a new generation)
    if (tempTimetableData) {
        dataToDisplay = JSON.parse(tempTimetableData);
        titleToDisplay = tempTimetableName || "Newly Generated Timetable";
        
        // Clear temporary data once loaded
        localStorage.removeItem('currentTimetableData');
        localStorage.removeItem('currentTimetableName');

    } else {
        // 2. Fallback: Load the latest permanently saved timetable
        try {
            const response = await fetch(`${BASE_URL}/api/get_latest_saved_timetable`);
            if (response.ok) {
                dataToDisplay = await response.json();
                titleToDisplay = "Latest Saved Timetable";
            } else {
                // If 404/error, just show empty.
                const errorData = await response.json();
                console.warn(errorData.error || "No saved timetable found.");
            }
        } catch (error) {
            console.error("Error loading latest timetable:", error);
        }
    }
    
    // Display the initial data
    displayTimetable(dataToDisplay, titleToDisplay);
    
    setupTimetableEventListeners(dataToDisplay);
}

function setupTimetableEventListeners(initialData) {
    let currentTimetableData = initialData;

    // --- Update currentTimetableData when setting up
    const updateCurrentData = (data) => {
        currentTimetableData = data;
    }
    
    // --- Save Button ---
    document.getElementById("saveBtn")?.addEventListener("click", async () => {
        if (currentTimetableData.length === 0) {
            showModal("Error", "No timetable data available to save.");
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/save_timetable`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentTimetableData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Unknown server error.");
            
            // UI Improvement: Show a better confirmation after saving
            document.getElementById("saveBtn").classList.add('bg-green-500');
            document.getElementById("saveBtn").textContent = 'Saved Successfully!';
            setTimeout(() => {
                document.getElementById("saveBtn").classList.remove('bg-green-500');
                document.getElementById("saveBtn").textContent = 'Save Timetable';
            }, 1500);

            // Re-enable original modal for full message
            showModal("Success", result.message || "Timetable saved!");
        } catch (error) {
            console.error("Save Error:", error);
            showModal("Error", `Failed to save timetable: ${error.message}`);
        }
    });

    // --- Load Button ---
    document.getElementById("loadBtn")?.addEventListener("click", handleLoadTimetables);
    
    // --- Export Button ---
    document.getElementById("exportPdfBtn")?.addEventListener("click", handleExportTimetables);


    // --- Filter Event Listeners ---
    document.getElementById("view-semester-select")?.addEventListener("change", async (e) => {
        const semesterId = e.target.value;
        const batchSelect = document.getElementById("view-batch-select");
        
        // 1. Update Batch Dropdown (Cascading Filter)
        if (semesterId !== "all") {
            try {
                // Assuming fetchBatchesBySemester is implemented to filter client-side since API route is missing
                const filteredBatches = batches.filter(b => b.semester_id.toString() === semesterId.toString());
                const currentBatchId = batchSelect.value; 
                populateSelect("view-batch-select", filteredBatches, "batch_id", "batch_name", "All Batches");
                 if (filteredBatches.some(b => b.batch_id.toString() === currentBatchId)) {
                    batchSelect.value = currentBatchId;
                } else {
                    batchSelect.value = "all";
                }
            } catch (error) {
                console.error("Error updating batches:", error);
            }
        } else {
            // Restore all batches if "All Semesters" is selected
            populateSelect("view-batch-select", batches, "batch_id", "batch_name", "All Batches");
        }

        // 2. Fetch and display filtered timetable data
        if (semesterId === "all") {
            // Re-fetch latest saved to ensure filters start fresh
            const response = await fetch(`${BASE_URL}/api/get_latest_saved_timetable`);
            const data = await response.json();
            const newData = response.ok ? data : [];
            updateCurrentData(newData);
            displayTimetable(newData, "Latest Saved Timetable");
            return;
        }
        
        try {
            const response = await fetch(`${BASE_URL}/api/get_semester_timetable/${semesterId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unknown server error.");
            updateCurrentData(data); // Store newly filtered data
            displayTimetable(data, `Timetable for Semester: ${e.target.selectedOptions[0].textContent}`);
        } catch (error) {
            console.error("View Semester Error:", error);
            showModal("Error", `Failed to load semester timetable: ${error.message}`);
        }
    });

    document.getElementById("view-batch-select")?.addEventListener("change", async (e) => {
        const batchId = e.target.value;
        if (batchId === "all") {
            // Re-display the currently loaded data (which is stored in currentTimetableData)
            displayTimetable(currentTimetableData, "Latest Timetable"); 
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/get_batch_timetable/${batchId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unknown server error.");
            
            // Note: Filters work on the latest SAVED data, not the unsaved one
            displayTimetable(data, `Timetable for Batch: ${e.target.selectedOptions[0].textContent}`);
        } catch (error) {
            console.error("View Batch Error:", error);
            showModal("Error", `Failed to load batch timetable: ${error.message}`);
        }
    });
    
    document.getElementById("view-faculty-select")?.addEventListener("change", async (e) => {
        const facultyId = e.target.value;
        if (facultyId === "all") {
             displayTimetable(currentTimetableData, "Latest Timetable");
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/get_faculty_timetable/${facultyId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unknown server error.");
            displayTimetable(data, `Timetable for Faculty: ${e.target.selectedOptions[0].textContent}`);
        } catch (error) {
            console.error("View Faculty Error:", error);
            showModal("Error", `Failed to load faculty timetable: ${error.message}`);
        }
    });

    document.getElementById("view-student-select")?.addEventListener("change", async (e) => {
        const studentId = e.target.value;
        if (studentId === "all") {
             displayTimetable(currentTimetableData, "Latest Timetable");
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/api/get_student_timetable/${studentId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Unknown server error.");
            displayTimetable(data, `Timetable for Student: ${e.target.selectedOptions[0].textContent}`);
        } catch (error) {
            console.error("View Student Error:", error);
            showModal("Error", `Failed to load student timetable: ${error.message}`);
        }
    });
}

// ----------------- Display Timetable Logic (Batch-Wise) -----------------

function createTimetableGrid(batchTitle, classes) {
    const timeSlots = ["9:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00"];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let html = `
        <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3 text-center">${batchTitle}</h3>
        <div class="overflow-x-auto rounded-lg shadow-xl mb-8 border border-gray-200">
            <table class="min-w-full bg-white border-collapse">
                <thead>
                    <tr class="bg-gray-700 text-white">
                        <th class="py-3 px-4 border-r border-gray-600">Day</th>
                        ${timeSlots.map(slot => `<th class="py-3 px-4 border-r border-gray-600">${slot}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    days.forEach((day) => {
        html += `<tr><td class="py-3 px-4 border border-gray-200 font-bold bg-gray-50 text-gray-700">${day}</td>`;
        timeSlots.forEach((slot) => {
            // Find all classes matching this day and time for this batch
            const classItem = classes.find((item) => item.day === day && item.time === slot);
            
            if (classItem) {
                // UI Improvement: Enhanced cell styling for readability
                const subjectClass = classItem.subject.includes('Lab') ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-blue-100 text-blue-800 border-blue-300';
                
                html += `<td class="py-2 px-3 border border-gray-200 text-sm ${subjectClass} transition hover:shadow-md hover:bg-opacity-80">
                    <div class="font-bold text-base mb-0.5">${classItem.subject}</div>
                    <div class="text-xs text-gray-700">T: ${classItem.teacher}</div>
                    <div class="text-xs text-gray-600">R: ${classItem.room}</div>
                  </td>`;
            } else {
                html += `<td class="py-2 px-4 border border-gray-200 text-gray-400 bg-white">--</td>`;
            }
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}

function displayTimetable(data, title = "Timetable") {
    timetableContainer = document.getElementById("timetable-container");
    timetableTitle = document.getElementById("timetable-title");
    fitnessScoreDiv = document.getElementById("fitness-score");

    timetableContainer.innerHTML = ''; 

    if (!data || data.length === 0) {
        timetableContainer.innerHTML = '<p class="py-4 text-center text-gray-500">No timetable data available for this view.</p>';
        timetableTitle.textContent = title;
        fitnessScoreDiv.classList.add("hidden");
        return;
    }

    // 1. Group data by batch
    const batchesMap = data.reduce((acc, item) => {
        const batchName = item.batch || 'Unknown Batch';
        if (!acc[batchName]) {
            acc[batchName] = [];
        }
        acc[batchName].push(item);
        return acc;
    }, {});

    // 2. Render fitness score at the top (from the first item if available)
    const fitnessScore = data.find(item => item.fitness !== undefined)?.fitness;
    if (fitnessScore !== undefined && fitnessScore !== null) {
        fitnessScoreDiv.textContent = `Overall Fitness Score: ${fitnessScore.toFixed(4)}`;
        fitnessScoreDiv.classList.remove("hidden");
    } else {
        fitnessScoreDiv.classList.add("hidden");
    }
    
    timetableTitle.textContent = title;

    // 3. Render a separate table for each batch
    let allGridsHtml = '';
    const sortedBatchNames = Object.keys(batchesMap).sort();

    sortedBatchNames.forEach(batchName => {
        const batchClasses = batchesMap[batchName];
        allGridsHtml += createTimetableGrid(batchName, batchClasses);
    });

    timetableContainer.innerHTML = allGridsHtml;
}
