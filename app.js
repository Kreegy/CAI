// Supabase configuration
const SUPABASE_URL = 'https://rfcqtttbhlwktmuabqad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3F0dHRiaGx3a3RtdWFicWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc1NzcsImV4cCI6MjA1MTI0MzU3N30.En4mzT8ILXkPkVHKGhVXXZ5ytwy6HOn5G5OFvbc2g0g';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Add event listener for class change
document.getElementById('class').addEventListener('change', () => {
    initializeTable();
});

// Load subjects and competencies
async function loadSubjectsAndCompetencies() {
    const subjectSelect = document.getElementById('subject');
    const competenceSelect = document.getElementById('competence');

    // Initialize selects
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    competenceSelect.innerHTML = '<option value="">Select Competency</option>';

    try {
        // Load subjects
        const { data: subjects, error: subjectError } = await supabaseClient
            .from('subjects')
            .select('*')
            .order('name');

        if (subjectError) {
            console.error('Error loading subjects:', subjectError);
            subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
            return;
        }

        if (!subjects || subjects.length === 0) {
            subjectSelect.innerHTML = '<option value="">No subjects found</option>';
            return;
        }

        // Reset subject select with default option
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.code;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });

        // Select first subject and load its competencies
        if (subjects.length > 0) {
            subjectSelect.value = subjects[0].code;
            await loadCompetencies(subjects[0].code);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }

    // Add event listener for subject change
    subjectSelect.addEventListener('change', (e) => {
        loadCompetencies(e.target.value);
        initializeTable();
    });

    // Add event listener for competency change
    competenceSelect.addEventListener('change', () => {
        initializeTable();
    });
}

// Load competencies for selected subject
async function loadCompetencies(subjectCode) {
    const competenceSelect = document.getElementById('competence');
    const tableBody = document.getElementById('studentTableBody');

    // Initialize competency select
    competenceSelect.innerHTML = '<option value="">Select Competency</option>';

    // Clear table while loading competencies
    tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Please select a competency</td></tr>';

    if (!subjectCode) {
        return;
    }

    try {
        const { data: competencies, error } = await supabaseClient
            .from('competencies')
            .select('*')
            .eq('subject_code', subjectCode)
            .order('description');

        if (error) {
            console.error('Error loading competencies:', error);
            competenceSelect.innerHTML = '<option value="">Error loading competencies</option>';
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading competencies. Please try again.</td></tr>';
            return;
        }

        if (!competencies || competencies.length === 0) {
            competenceSelect.innerHTML = '<option value="">No competencies found</option>';
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">No competencies found for this subject</td></tr>';
            return;
        }

        // Reset competency select with default option
        competenceSelect.innerHTML = '<option value="">Select Competency</option>';

        competencies.forEach(competency => {
            const option = document.createElement('option');
            option.value = competency.id;
            option.textContent = competency.description;
            competenceSelect.appendChild(option);
        });

        // Select first competency and initialize table
        if (competencies.length > 0) {
            competenceSelect.value = competencies[0].id;
            initializeTable();
        }
    } catch (error) {
        console.error('Error loading competencies:', error);
        competenceSelect.innerHTML = '<option value="">Error loading competencies</option>';
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading competencies. Please try again.</td></tr>';
    }
}

// Load students from Supabase
async function loadStudents() {
    const tableBody = document.getElementById('studentTableBody');
    const selectedClass = document.getElementById('class').value;
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Loading students...</td></tr>';

    try {
        const { data: students, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('class', selectedClass)
            .order('name');

        if (error) throw error;
        
        if (students.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">No students found in class ' + selectedClass + '</td></tr>';
            return [];
        }
        
        return students;
    } catch (error) {
        console.error('Error loading students:', error);
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading students. Please try again.</td></tr>';
        throw error;
    }
}

// Initialize the table with student data
async function initializeTable() {
    const tableBody = document.getElementById('studentTableBody');
    const subjectCode = document.getElementById('subject').value;
    const competencyId = document.getElementById('competence').value;

    if (!subjectCode || !competencyId) {
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Please select a subject and competency</td></tr>';
        return;
    }

    try {
        const students = await loadStudents();
        if (!Array.isArray(students) || students.length === 0) return;

        // Fetch existing scores for the current subject and competency
        const { data: scores, error: scoresError } = await supabaseClient
            .from('assessments')
            .select('*')
            .eq('subject_code', subjectCode)
            .eq('competency_id', competencyId)
            .in('student_id', students.map(s => s.id));

        if (scoresError) {
            console.error('Error loading scores:', scoresError);
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading scores. Please try again.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div>${student.id}</div>
                    <div>${student.name}</div>
                </td>
                ${generateScoreColumns(student.id, scores || [])}
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to all score inputs
        addScoreInputListeners();
    } catch (error) {
        console.error('Error initializing table:', error);
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading data. Please try again.</td></tr>';
    }
}

// Generate score input columns for each level
function generateScoreColumns(studentId, scores) {
    let columns = '';
    for (let i = 1; i <= 5; i++) {
        const studentScores = scores?.find(s => s.student_id === studentId && s.level === i) || {};
        columns += `
            <td><input type="number" min="0" max="100" class="score-input" data-level="${i}" data-type="subject" value="${studentScores.score_subject || ''}"></td>
            <td><input type="number" min="0" max="100" class="score-input" data-level="${i}" data-type="generic" value="${studentScores.score_generic || ''}"></td>
        `;
    }
    return columns;
}

// Add event listeners to score inputs with auto-save
function addScoreInputListeners() {
    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
        let saveTimeout;

        input.addEventListener('input', (e) => {
            const row = e.target.closest('tr');
            const studentId = row.querySelector('td:first-child div:first-child').textContent;

            // Clear existing timeout
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            // Set new timeout for auto-save
            saveTimeout = setTimeout(() => {
                saveScore(studentId, e.target);
            }, 2000); // Auto-save after 2 seconds of inactivity
        });
    });
}

// Save score to Supabase
async function saveScore(studentId, input) {
    const level = input.dataset.level;
    const scoreType = input.dataset.type;
    const value = input.value;
    const subjectCode = document.getElementById('subject').value;
    const competencyId = document.getElementById('competence').value;

    try {
        const { error } = await supabaseClient
            .from('assessments')
            .upsert({
                student_id: studentId,
                subject_code: subjectCode,
                competency_id: competencyId,
                level: parseInt(level),
                [`score_${scoreType}`]: parseInt(value)
            }, {
                onConflict: 'student_id,subject_code,competency_id,level'
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Error saving score');
    }
}

// Save all data
async function saveData() {
    const inputs = document.querySelectorAll('.score-input');
    const savePromises = [];

    inputs.forEach(input => {
        if (input.value) {
            const row = input.closest('tr');
            const studentId = row.querySelector('td:first-child div:first-child').textContent;
            savePromises.push(saveScore(studentId, input));
        }
    });

    try {
        await Promise.all(savePromises);
        alert('All data saved successfully!');
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving some data');
    }
}

// Search students
function searchStudents() {
    const searchText = document.getElementById('searchStudent').value.toLowerCase();
    const rows = document.getElementById('studentTableBody').getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const studentName = row.querySelector('td:first-child div:last-child').textContent.toLowerCase();
        row.style.display = studentName.includes(searchText) ? '' : 'none';
    });
}

// Print data
function printData() {
    window.print();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadSubjectsAndCompetencies();
    initializeTable();
});

document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('assessmentTable');
    if (table) {
        table.addEventListener('click', function(e) {
            let tr = e.target.closest('tr');
            if (tr && tr.parentNode.tagName === 'TBODY') {
                document.querySelectorAll('#assessmentTable tbody tr').forEach(row => row.classList.remove('selected-row'));
                tr.classList.add('selected-row');
            }
        });
    }
});
