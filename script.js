// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Display current date (frozen)
    displayCurrentDate();
    
    // Load and display data
    loadAndDisplayData();
    
    // Event listeners
    document.getElementById('report-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('office-dropdown').addEventListener('change', handleOfficeChange);
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);
    
    // Initialize charts
    initializeCharts();
});

// Display current date in the specified format
function displayCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-IN', options);
    document.getElementById('current-date').textContent = formattedDate;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const office = document.getElementById('entry-office').value;
    const totalEmp = parseInt(document.getElementById('total-emp').value);
    const registeredEmp = parseInt(document.getElementById('registered-emp').value);
    const enrolledEmp = parseInt(document.getElementById('enrolled-emp').value);
    const completedCourse = parseInt(document.getElementById('completed-course').value);
    
    // Validate data
    if (registeredEmp > totalEmp) {
        alert('Registered employees cannot be more than total employees');
        return;
    }
    
    if (enrolledEmp > registeredEmp) {
        alert('Enrolled employees cannot be more than registered employees');
        return;
    }
    
    // Create report object
    const today = new Date();
    const report = {
        date: today.toISOString().split('T')[0],
        office: office,
        totalEmployees: totalEmp,
        registeredEmployees: registeredEmp,
        enrolledEmployees: enrolledEmp,
        completedCourses: completedCourse
    };
    
    try {
        // Send data to server
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(report)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.msg);
            // Reset form
            document.getElementById('report-form').reset();
            // Reload data display
            loadAndDisplayData();
        } else {
            alert('Error: ' + data.msg);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to save report. Please try again.');
    }
}

// Handle office dropdown change
async function handleOfficeChange() {
    const selectedOffice = document.getElementById('office-dropdown').value;
    if (!selectedOffice) return;
    
    try {
        // Get latest report for selected office
        const response = await fetch(`/api/reports/office/${selectedOffice}`);
        
        if (response.ok) {
            const latestReport = await response.json();
            
            // Update statistics cards
            document.getElementById('total-employees').textContent = latestReport.totalEmployees;
            document.getElementById('registered-employees').textContent = latestReport.registeredEmployees;
            document.getElementById('enrolled-employees').textContent = latestReport.enrolledEmployees;
            document.getElementById('completed-courses').textContent = latestReport.completedCourses;
        } else {
            // Reset statistics cards if no data
            document.getElementById('total-employees').textContent = '0';
            document.getElementById('registered-employees').textContent = '0';
            document.getElementById('enrolled-employees').textContent = '0';
            document.getElementById('completed-courses').textContent = '0';
        }
    } catch (err) {
        console.error('Error:', err);
        // Reset statistics cards if error
        document.getElementById('total-employees').textContent = '0';
        document.getElementById('registered-employees').textContent = '0';
        document.getElementById('enrolled-employees').textContent = '0';
        document.getElementById('completed-courses').textContent = '0';
    }
}

// Load and display data
async function loadAndDisplayData() {
    try {
        // Get summary statistics
        const summaryResponse = await fetch('/api/reports/summary');
        if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            
            // Update statistics cards
            document.getElementById('total-employees').textContent = summary.totalEmployees;
            document.getElementById('registered-employees').textContent = summary.registeredEmployees;
            document.getElementById('enrolled-employees').textContent = summary.enrolledEmployees;
            document.getElementById('completed-courses').textContent = summary.completedCourses;
        }
        
        // Get all reports
        const reportsResponse = await fetch('/api/reports');
        if (reportsResponse.ok) {
            const reports = await reportsResponse.json();
            
            // Display in table
            displayReportsTable(reports);
            
            // Update charts
            updateChartsWithFilteredData(reports);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to load data. Please try again.');
    }
}

// Display reports in table
function displayReportsTable(reports) {
    const tableBody = document.getElementById('report-table-body');
    tableBody.innerHTML = '';
    
    // Sort reports by date (newest first) and then by office
    const sortedReports = reports.sort((a, b) => {
        const dateComparison = new Date(b.date) - new Date(a.date);
        if (dateComparison !== 0) return dateComparison;
        return a.office.localeCompare(b.office);
    });
    
    sortedReports.forEach(report => {
        const row = document.createElement('tr');
        
        // Format date for display
        const displayDate = new Date(report.date).toLocaleDateString('en-IN');
        
        row.innerHTML = `
            <td>${displayDate}</td>
            <td>${report.office}</td>
            <td>${report.totalEmployees}</td>
            <td>${report.registeredEmployees}</td>
            <td>${report.enrolledEmployees}</td>
            <td>${report.completedCourses}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Apply filters
async function applyFilters() {
    const selectedOffice = document.getElementById('filter-office').value;
    const selectedDate = document.getElementById('filter-date').value;
    
    try {
        // Build query string
        let queryParams = new URLSearchParams();
        if (selectedOffice && selectedOffice !== 'all') {
            queryParams.append('office', selectedOffice);
        }
        if (selectedDate) {
            queryParams.append('date', selectedDate);
        }
        
        // Fetch filtered reports
        const response = await fetch(`/api/reports/filter?${queryParams.toString()}`);
        
        if (response.ok) {
            const reports = await response.json();
            
            // Display filtered reports
            displayReportsTable(reports);
            
            // Update charts with filtered data
            updateChartsWithFilteredData(reports);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to apply filters. Please try again.');
    }
}

// Reset filters
async function resetFilters() {
    document.getElementById('filter-office').value = 'all';
    document.getElementById('filter-date').value = '';
    
    // Load all data
    try {
        const response = await fetch('/api/reports');
        
        if (response.ok) {
            const reports = await response.json();
            
            // Display all reports
            displayReportsTable(reports);
            
            // Update charts with all data
            updateChartsWithFilteredData(reports);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to reset filters. Please try again.');
    }
}

// Initialize charts
function initializeCharts() {
    // Office-wise chart
    const officeCtx = document.getElementById('office-chart').getContext('2d');
    window.officeChart = new Chart(officeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Employees',
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Registered on iGOT',
                    backgroundColor: 'rgba(42, 245, 152, 0.6)',
                    borderColor: 'rgba(42, 245, 152, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Enrolled in Courses',
                    backgroundColor: 'rgba(246, 211, 101, 0.6)',
                    borderColor: 'rgba(246, 211, 101, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Courses Completed',
                    backgroundColor: 'rgba(255, 154, 158, 0.6)',
                    borderColor: 'rgba(255, 154, 158, 1)',
                    borderWidth: 1,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Date-wise chart
    const dateCtx = document.getElementById('date-chart').getContext('2d');
    window.dateChart = new Chart(dateCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Registered on iGOT',
                    backgroundColor: 'rgba(42, 245, 152, 0.1)',
                    borderColor: 'rgba(42, 245, 152, 1)',
                    borderWidth: 2,
                    fill: true,
                    data: []
                },
                {
                    label: 'Enrolled in Courses',
                    backgroundColor: 'rgba(246, 211, 101, 0.1)',
                    borderColor: 'rgba(246, 211, 101, 1)',
                    borderWidth: 2,
                    fill: true,
                    data: []
                },
                {
                    label: 'Courses Completed',
                    backgroundColor: 'rgba(255, 154, 158, 0.1)',
                    borderColor: 'rgba(255, 154, 158, 1)',
                    borderWidth: 2,
                    fill: true,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Update charts with data
    updateCharts();
}

// Update charts
function updateCharts() {
    const reports = JSON.parse(localStorage.getItem('igotReports'));
    updateChartsWithFilteredData(reports);
}

// Update charts with filtered data
function updateChartsWithFilteredData(reports) {
    // Office-wise data
    const officeData = {};
    const offices = [];
    
    // Get unique offices and aggregate latest data for each office
    reports.forEach(report => {
        if (!officeData[report.office] || new Date(report.date) > new Date(officeData[report.office].date)) {
            officeData[report.office] = report;
        }
    });
    
    // Prepare data for chart
    Object.keys(officeData).forEach(office => {
        offices.push(office);
    });
    
    const totalEmployees = offices.map(office => officeData[office].totalEmployees);
    const registeredEmployees = offices.map(office => officeData[office].registeredEmployees);
    const enrolledEmployees = offices.map(office => officeData[office].enrolledEmployees);
    const completedCourses = offices.map(office => officeData[office].completedCourses);
    
    // Update office chart
    window.officeChart.data.labels = offices;
    window.officeChart.data.datasets[0].data = totalEmployees;
    window.officeChart.data.datasets[1].data = registeredEmployees;
    window.officeChart.data.datasets[2].data = enrolledEmployees;
    window.officeChart.data.datasets[3].data = completedCourses;
    window.officeChart.update();
    
    // Date-wise data
    const dateData = {};
    const dates = [];
    
    // Get unique dates and aggregate data for each date
    reports.forEach(report => {
        if (!dateData[report.date]) {
            dateData[report.date] = {
                registeredEmployees: 0,
                enrolledEmployees: 0,
                completedCourses: 0
            };
            dates.push(report.date);
        }
        
        dateData[report.date].registeredEmployees += report.registeredEmployees;
        dateData[report.date].enrolledEmployees += report.enrolledEmployees;
        dateData[report.date].completedCourses += report.completedCourses;
    });
    
    // Sort dates
    dates.sort();
    
    const dateRegistered = dates.map(date => dateData[date].registeredEmployees);
    const dateEnrolled = dates.map(date => dateData[date].enrolledEmployees);
    const dateCompleted = dates.map(date => dateData[date].completedCourses);
    
    // Format dates for display
    const formattedDates = dates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN');
    });
    
    // Update date chart
    window.dateChart.data.labels = formattedDates;
    window.dateChart.data.datasets[0].data = dateRegistered;
    window.dateChart.data.datasets[1].data = dateEnrolled;
    window.dateChart.data.datasets[2].data = dateCompleted;
    window.dateChart.update();
}