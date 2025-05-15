// Supabase configuration
const SUPABASE_URL = 'https://rfcqtttbhlwktmuabqad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmY3F0dHRiaGx3a3RtdWFicWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2Njc1NzcsImV4cCI6MjA1MTI0MzU3N30.En4mzT8ILXkPkVHKGhVXXZ5ytwy6HOn5G5OFvbc2g0g';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Add event listeners for class, term, and competency changes
document.getElementById('class').addEventListener('change', () => {
    loadStudents();
});

document.getElementById('term').addEventListener('change', () => {
    loadStudents();
});

document.getElementById('competence').addEventListener('change', () => {
    loadStudents();
});

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
            return;
        }
        
        // Fetch existing project scores for the students
        const selectedTerm = document.getElementById('term').value;
        const selectedCompetency = document.getElementById('competence').value;
        
        const { data: projectScores, error: scoresError } = await supabaseClient
            .from('project_scores')
            .select('*')
            .eq('class', selectedClass)
            .eq('term', selectedTerm)
            .eq('competency', selectedCompetency)
            .in('student_id', students.map(s => s.id));

        if (scoresError) {
            console.error('Error loading project scores:', scoresError);
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading scores. Please try again.</td></tr>';
            return;
        }

        // Clear table and populate with student data
        tableBody.innerHTML = '';
        students.forEach(student => {
            const studentScore = projectScores?.find(score => score.student_id === student.id) || {};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="student-id">${student.id}</td>
                <td class="student-name">${student.name}</td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="gathers_resources" value="${studentScore.gathers_resources || ''}" title="Score for Gathers Resources"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="uses_resources" value="${studentScore.uses_resources || ''}" title="Score for Uses Resources"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="engages_stakeholders" value="${studentScore.engages_stakeholders || ''}" title="Score for Engages Stakeholders"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="creates_product" value="${studentScore.creates_product || ''}" title="Score for Creates Product"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="critical_thinking" value="${studentScore.critical_thinking || ''}" title="Score for Critical Thinking"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="communication" value="${studentScore.communication || ''}" title="Score for Communication"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="creativity" value="${studentScore.creativity || ''}" title="Score for Creativity"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="cooperation" value="${studentScore.cooperation || ''}" title="Score for Cooperation"></td>
                <td><input type="number" min="0" max="100" class="score-input" data-category="mathematical_competence" value="${studentScore.mathematical_competence || ''}" title="Score for Mathematical Competence"></td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to all score inputs
        addScoreInputListeners();
    } catch (error) {
        console.error('Error loading students:', error);
        tableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Error loading students. Please try again.</td></tr>';
    }
}

// Add event listeners to score inputs with auto-save
function addScoreInputListeners() {
    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
        let saveTimeout;

        input.addEventListener('input', (e) => {
            const row = e.target.closest('tr');
            const studentId = row.querySelector('td:first-child').textContent;

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
    const category = input.dataset.category;
    const value = input.value;
    const selectedClass = document.getElementById('class').value;
    const term = document.getElementById('term').value;
    const competency = document.getElementById('competence').value;

    try {
        const { error } = await supabaseClient
            .from('project_scores')
            .upsert({
                student_id: studentId,
                class: selectedClass,
                term: parseInt(term),
                competency: competency,
                [category]: value ? parseInt(value) : null
            }, {
                onConflict: 'student_id,class,term,competency'
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Error saving score');
    }
}

// Save all data
async function saveData() {
    const rows = document.querySelectorAll('#studentTableBody tr');
    const savePromises = [];

    rows.forEach(row => {
        const studentId = row.querySelector('td:first-child').textContent;
        const inputs = row.querySelectorAll('.score-input');
        
        inputs.forEach(input => {
            if (input.value) {
                savePromises.push(saveScore(studentId, input));
            }
        });
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
        const studentName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        row.style.display = studentName.includes(searchText) ? '' : 'none';
    });
}

// Print data
function printData() {
    window.print();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
});

document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('projectTable');
    if (table) {
        table.addEventListener('click', function(e) {
            let tr = e.target.closest('tr');
            if (tr && tr.parentNode.tagName === 'TBODY') {
                document.querySelectorAll('#projectTable tbody tr').forEach(row => row.classList.remove('selected-row'));
                tr.classList.add('selected-row');
                
                // Focus the first input in the selected row
                const firstInput = tr.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        });
    }
    
    // Add visual feedback when input fields are focused
    document.addEventListener('focus', function(e) {
        if (e.target.classList.contains('score-input')) {
            const row = e.target.closest('tr');
            if (row) {
                document.querySelectorAll('#projectTable tbody tr').forEach(r => r.classList.remove('selected-row'));
                row.classList.add('selected-row');
            }
        }
    }, true);
});