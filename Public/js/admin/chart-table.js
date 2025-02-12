document.addEventListener("DOMContentLoaded", () => {
    const timeRangeSelect = document.getElementById("timeRange");
    const customDateRange = document.getElementById("custom-date-range");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const applyFiltersButton = document.getElementById("applyFilters");

    // Toggle custom date range inputs based on selection
    timeRangeSelect.addEventListener("change", (e) => {
        if (e.target.value === "custom") {
            customDateRange.style.display = "block";
        } else {
            customDateRange.style.display = "none";
        }
    });

    // Fetch data and update charts on filter application
    applyFiltersButton.addEventListener("click", async () => {
        const timeRange = timeRangeSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        // Validate custom date range if selected
        if (!validateDates(startDate, endDate)) {
            return; 
        }

        try {
            // Fetch data for each chart
            const topProducts = await fetchChartData("/top-products", timeRange, startDate, endDate);
            const topCategories = await fetchChartData("/top-categories", timeRange, startDate, endDate);
            const topBrands = await fetchChartData("/top-brands", timeRange, startDate, endDate);

            // Update charts
            updateChart("top-products-chart", topProducts, "Best-Selling Products");
            updateChart("top-categories-chart", topCategories, "Best-Selling Categories");
            updateChart("top-brands-chart", topBrands, "Best-Selling Brands");
        } catch (error) {
            console.error("Error fetching or updating charts:", error);
        }
    });
});

// Helper function to fetch chart data
async function fetchChartData(endpoint, timeRange, startDate, endDate) {
    const params = new URLSearchParams({ timeRange });
    if (timeRange === "custom") {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`);
    if (!response.ok) throw new Error(`Error fetching data from ${endpoint}`);
    return response.json();
}

// Helper function to update a chart
function updateChart(canvasId, data, label) {
    const ctx = document.getElementById(canvasId).getContext("2d");

// Destroy any existing chart instance first.
if (Chart.getChart(canvasId)) {
  Chart.getChart(canvasId).destroy();
}

const chart = new Chart(ctx, {
  type: "polarArea",
  data: {
    labels: data.map(item => item.name || "Unknown"),
    datasets: [{
      label: label,
      data: data.map(item => item.totalSales),
      backgroundColor: [
        "rgba(255, 99, 132, 0.6)",
        "rgba(54, 162, 235, 0.6)",
        "rgba(255, 206, 86, 0.6)",
        "rgba(75, 192, 192, 0.6)",
        "rgba(153, 102, 255, 0.6)",
        "rgba(255, 159, 64, 0.6)"
      ],
      
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "right" }
    }
  }
});

return chart;
}



document.getElementById("report-type").addEventListener("change", function () {
    const reportType = this.value;
    const dateFields = document.getElementById("date-fields");

    if (reportType === "custom") {
        dateFields.style.display = "flex"; // Show date inputs
    } else {
        dateFields.style.display = "none"; // Hide date inputs
    }
});

document.getElementById("report-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const reportType = document.getElementById("report-type").value;
    let startDate, endDate;

    if (reportType === "custom") {
        startDate = document.getElementById("start-date").value;
        endDate = document.getElementById("end-date").value;

        if (!validateDates(startDate, endDate)) {
            return; 
        }
    } else {
        // Automatically calculate date range using Day.js
        ({ startDate, endDate } = getAutoDateRange(reportType));
    }

    // Fetch sales data for the selected range and type
    fetchSalesReport(startDate, endDate, reportType);
});

function getAutoDateRange(reportType) {
    const today = dayjs();
    let startDate, endDate;

    switch (reportType) {
        case "daily":
            startDate = today.startOf('day').format('YYYY-MM-DD');
            endDate = today.endOf('day').format('YYYY-MM-DD');
            break;
        case "weekly":
            startDate = today.startOf('week').format('YYYY-MM-DD');
            endDate = today.endOf('week').format('YYYY-MM-DD');
            break;
        case "monthly":
            startDate = today.startOf('month').format('YYYY-MM-DD');
            endDate = today.endOf('month').format('YYYY-MM-DD');
            break;
        default:
            startDate = today.format('YYYY-MM-DD');
            endDate = today.format('YYYY-MM-DD');
    }

    return { startDate, endDate };
}

function validateDates(startDate, endDate) {
    if (!startDate || !endDate) {
       
        Swal.fire({
            title: "Error",
            text: "Please enter valid start and end dates.",
            icon: "error",
            confirmButtonText: "OK",

        })
        return false;
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isAfter(end)) {
        Swal.fire({
            title: "Error",
            text: "Start date cannot be after end date.",
            icon: "error",
            confirmButtonText: "OK",
        })
        return false;
    }

    return true;
}


function fetchSalesReport(startDate, endDate, reportType) {
    fetch(`/generate-report`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            startDate: startDate,
            endDate: endDate,
            reportType: reportType,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            // Populate table with data
            updateSalesTable(data);

            // Show the download buttons
            document.getElementById("download-buttons").classList.remove("hidden");
        })
        .catch((error) => {
            console.error("Error fetching sales report:", error);
        });
}

function updateSalesTable(data) {
    const table = document.getElementById("report-table").querySelector("tbody");
    table.innerHTML = ""; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item._id}</td>
            <td>${item.salesCount}</td>
            <td>${item.totalOrderAmount.toFixed(2)}</td>
            <td>${item.totalDiscount.toFixed(2)}</td>
        `;
        table.appendChild(row);
    });

    // Show the table
    document.getElementById("report-table").classList.remove("hidden");
}

// Download handlers
document.getElementById("download-pdf").addEventListener("click", function () {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    
    window.location.href = `/download-pdf?startDate=${startDate}&endDate=${endDate}`;
});

document.getElementById("download-excel").addEventListener("click", function () {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    window.location.href = `/download-excel?startDate=${startDate}&endDate=${endDate}`;
});
