// Supabase configuration
const SUPABASE_URL = 'https://rfcqtttbhlwktmuabqad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3F0dHRiaGx3a3RtdWFicWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc1NzcsImV4cCI6MjA1MTI0MzU3N30.En4mzT8ILXkPkVHKGhVXXZ5ytwy6HOn5G5OFvbc2g0g';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Students Management
async function addStudent() {
    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    const studentClass = document.getElementById('studentClass').value;

    if (!studentId || !studentName || !studentClass) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('students')
            .upsert({
                id: studentId,
                name: studentName,
                class: studentClass
            });

        if (error) throw error;

        alert('Student added successfully!');
        loadStudents();
        clearStudentForm();
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student');
    }
}

// CSV Upload functionality
function uploadCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const statusDiv = document.getElementById('uploadStatus');
    const file = fileInput.files[0];

    if (!file) {
        showUploadStatus('Please select a CSV file', 'error');
        return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showUploadStatus('Please upload a valid CSV file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        processCSV(text);
    };
    reader.onerror = function() {
        showUploadStatus('Error reading file', 'error');
    };
    reader.readAsText(file);
}

async function processCSV(csv) {
    const lines = csv.split('\n');
    if (lines.length < 2) {
        showUploadStatus('CSV file is empty or invalid', 'error');
        return;
    }

    // Remove header row and empty lines
    const dataRows = lines.slice(1).filter(line => line.trim() !== '');
    const totalStudents = dataRows.length;
    let errorCount = 0;
    let invalidRows = [];

    showUploadStatus(`Processing ${totalStudents} students...`, '');

    const students = dataRows.map((row, index) => {
        const [id, name, studentClass] = row.split(',').map(field => field.trim());
        if (id && name && studentClass) {
            // Validate data format
            if (!/^[A-Za-z0-9]+$/.test(id)) {
                invalidRows.push(`Row ${index + 2}: Invalid Student ID format`);
                errorCount++;
                return null;
            }
            if (!/^[A-Za-z0-9\s]+$/.test(name)) {
                invalidRows.push(`Row ${index + 2}: Invalid Name format`);
                errorCount++;
                return null;
            }
            if (!['S3', 'S4'].includes(studentClass)) {
                invalidRows.push(`Row ${index + 2}: Invalid Class (must be S3 or S4)`);
                errorCount++;
                return null;
            }
            return {
                id: id,
                name: name,
                class: studentClass
            };
        } else {
            invalidRows.push(`Row ${index + 2}: Missing required fields`);
            errorCount++;
            return null;
        }
    }).filter(student => student !== null);

    if (students.length === 0) {
        showUploadStatus('No valid students to upload. Errors:\n' + invalidRows.join('\n'), 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('students')
            .upsert(students);

        if (error) {
            console.error('Supabase error:', error);
            showUploadStatus(`Database error: ${error.message}\n\nInvalid rows:\n${invalidRows.join('\n')}`, 'error');
            return;
        }

        const successMessage = `Successfully uploaded ${totalStudents - errorCount} students.`;
        const errorMessage = errorCount > 0 ? 
            `\n${errorCount} records had errors:\n${invalidRows.join('\n')}` : '';
        
        showUploadStatus(successMessage + errorMessage, errorCount > 0 ? 'warning' : 'success');
        loadStudents(); // Refresh the student list
        document.getElementById('csvFileInput').value = ''; // Clear the file input
    } catch (error) {
        console.error('Error uploading students:', error);
        showUploadStatus(`Error uploading students to database: ${error.message}\n\nInvalid rows:\n${invalidRows.join('\n')}`, 'error');
    }
}

function showUploadStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = message;
    statusDiv.className = 'upload-status';
    if (type) {
        statusDiv.classList.add(type);
    }
}

async function loadStudents() {
    try {
        const { data: students, error } = await supabaseClient
            .from('students')
            .select('*')
            .order('name');

        if (error) throw error;

        const tableBody = document.getElementById('studentsTableBody');
        tableBody.innerHTML = '';

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editStudent('${student.id}')">Edit</button>
                    <button class="delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Error loading students');
    }
}

async function editStudent(studentId) {
    try {
        const { data: student, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error) throw error;

        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentClass').value = student.class;
        document.getElementById('studentId').readOnly = true;
        openModal('studentModal');
    } catch (error) {
        console.error('Error loading student for edit:', error);
        alert('Error loading student data');
    }
}

async function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        try {
            const { error } = await supabaseClient
                .from('students')
                .delete()
                .eq('id', studentId);

            if (error) throw error;

            alert('Student deleted successfully!');
            loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Error deleting student');
        }
    }
}

function clearStudentForm() {
    document.getElementById('studentId').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentClass').value = 'S3';
    document.getElementById('studentId').readOnly = false;
}

// Subjects Management
async function addSubject() {
    const subjectCode = document.getElementById('subjectCode').value;
    const subjectName = document.getElementById('subjectName').value;

    if (!subjectCode || !subjectName) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('subjects')
            .upsert({
                code: subjectCode,
                name: subjectName
            });

        if (error) throw error;

        alert('Subject added successfully!');
        loadSubjects();
        clearSubjectForm();
    } catch (error) {
        console.error('Error adding subject:', error);
        alert('Error adding subject');
    }
}

async function loadSubjects() {
    try {
        const { data: subjects, error } = await supabaseClient
            .from('subjects')
            .select('*')
            .order('name');

        if (error) throw error;

        const tableBody = document.getElementById('subjectsTableBody');
        const competencySubjectSelect = document.getElementById('competencySubject');
        
        // Update subjects table
        tableBody.innerHTML = '';
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject.code}</td>
                <td>${subject.name}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editSubject('${subject.code}')">Edit</button>
                    <button class="delete-btn" onclick="deleteSubject('${subject.code}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update competency subject dropdown
        competencySubjectSelect.innerHTML = '<option value="">Select Subject</option>';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.code;
            option.textContent = subject.name;
            competencySubjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        alert('Error loading subjects');
    }
}

async function editSubject(subjectCode) {
    try {
        const { data: subject, error } = await supabaseClient
            .from('subjects')
            .select('*')
            .eq('code', subjectCode)
            .single();

        if (error) throw error;

        document.getElementById('subjectCode').value = subject.code;
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectCode').readOnly = true;
        openModal('subjectModal');
    } catch (error) {
        console.error('Error loading subject for edit:', error);
        alert('Error loading subject data');
    }
}

async function deleteSubject(subjectCode) {
    if (confirm('Are you sure you want to delete this subject?')) {
        try {
            const { error } = await supabaseClient
                .from('subjects')
                .delete()
                .eq('code', subjectCode);

            if (error) throw error;

            alert('Subject deleted successfully!');
            loadSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Error deleting subject');
        }
    }
}

function clearSubjectForm() {
    document.getElementById('subjectCode').value = '';
    document.getElementById('subjectName').value = '';
    document.getElementById('subjectCode').readOnly = false;
}

// Competencies Management
async function addCompetency() {
    const competencyId = document.getElementById('competencyId') ? document.getElementById('competencyId').value : null;
    const subjectCode = document.getElementById('competencySubject').value;
    const description = document.getElementById('competencyDescription').value;

    if (!subjectCode || !description) {
        alert('Please fill in all fields');
        return;
    }

    try {
        // Prepare the competency data
        const competencyData = {
            subject_code: subjectCode,
            description: description
        };
        
        // If editing an existing competency, include the ID
        if (competencyId) {
            competencyData.id = parseInt(competencyId);
        }

        const { error } = await supabaseClient
            .from('competencies')
            .upsert(competencyData);

        if (error) throw error;

        alert('Competency saved successfully!');
        loadCompetencies();
        clearCompetencyForm();
        closeModal('competencyModal');
    } catch (error) {
        console.error('Error saving competency:', error);
        alert('Error saving competency');
    }
}

async function loadCompetencies() {
    try {
        // Fetch all subjects for lookup
        const { data: subjects, error: subjectsError } = await supabaseClient
            .from('subjects')
            .select('*');
        if (subjectsError) throw subjectsError;

        // Fetch all competencies
        const { data: competencies, error } = await supabaseClient
            .from('competencies')
            .select('id, description, subject_code');
        if (error) throw error;

        const tableBody = document.getElementById('competenciesTableBody');
        tableBody.innerHTML = '';

        competencies.forEach(competency => {
            // Find subject name by code
            const subject = subjects.find(s => s.code === competency.subject_code);
            const subjectName = subject ? subject.name : competency.subject_code;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subjectName}</td>
                <td>${competency.description}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="editCompetency(${competency.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteCompetency(${competency.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading competencies:', error);
        alert('Error loading competencies');
    }
}

async function editCompetency(competencyId) {
    try {
        const { data: competency, error } = await supabaseClient
            .from('competencies')
            .select('*')
            .eq('id', competencyId)
            .single();

        if (error) throw error;

        // Check if competencyId field exists, create it if it doesn't
        let competencyIdField = document.getElementById('competencyId');
        if (!competencyIdField) {
            competencyIdField = document.createElement('input');
            competencyIdField.type = 'hidden';
            competencyIdField.id = 'competencyId';
            document.getElementById('competencyForm').appendChild(competencyIdField);
        }
        
        // Set values for form fields
        competencyIdField.value = competencyId;
        document.getElementById('competencySubject').value = competency.subject_code;
        document.getElementById('competencyDescription').value = competency.description;
        
        openModal('competencyModal');
    } catch (error) {
        console.error('Error loading competency for edit:', error);
        alert('Error loading competency data');
    }
}

async function deleteCompetency(competencyId) {
    if (confirm('Are you sure you want to delete this competency?')) {
        try {
            const { error } = await supabaseClient
                .from('competencies')
                .delete()
                .eq('id', competencyId);

            if (error) throw error;

            alert('Competency deleted successfully!');
            loadCompetencies();
        } catch (error) {
            console.error('Error deleting competency:', error);
            alert('Error deleting competency');
        }
    }
}

function clearCompetencyForm() {
    document.getElementById('competencySubject').value = '';
    document.getElementById('competencyDescription').value = '';
    
    // Clear the competency ID if the field exists
    const competencyIdField = document.getElementById('competencyId');
    if (competencyIdField) {
        competencyIdField.value = '';
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    if (modalId === 'studentModal') {
        clearStudentForm();
    } else if (modalId === 'subjectModal') {
        clearSubjectForm();
    } else if (modalId === 'competencyModal') {
        clearCompetencyForm();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        if (event.target.id === 'studentModal') {
            clearStudentForm();
        } else if (event.target.id === 'subjectModal') {
            clearSubjectForm();
        } else if (event.target.id === 'competencyModal') {
            clearCompetencyForm();
        }
    }
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    loadSubjects();
    loadCompetencies();
});