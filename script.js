const STORAGE_KEY = "fitnessTracker.activities";
const GOALS = {
  steps: 10000,
  duration: 60,
  calories: 500,
};

const form = document.querySelector("#activityForm");
const activityDate = document.querySelector("#activityDate");
const exerciseType = document.querySelector("#exerciseType");
const durationInput = document.querySelector("#duration");
const caloriesInput = document.querySelector("#calories");
const stepsInput = document.querySelector("#steps");
const historyBody = document.querySelector("#historyBody");
const historyCount = document.querySelector("#historyCount");
const emptyState = document.querySelector("#emptyState");
const clearAllBtn = document.querySelector("#clearAllBtn");

const totalSteps = document.querySelector("#totalSteps");
const totalDuration = document.querySelector("#totalDuration");
const totalCalories = document.querySelector("#totalCalories");
const stepsProgress = document.querySelector("#stepsProgress");
const durationProgress = document.querySelector("#durationProgress");
const caloriesProgress = document.querySelector("#caloriesProgress");

let activities = [];
let progressChart;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(value);
}

function readActivities() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

function createActivityId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getTodayTotals() {
  const currentDate = todayIso();
  return activities
    .filter((activity) => activity.date === currentDate)
    .reduce(
      (totals, activity) => ({
        steps: totals.steps + activity.steps,
        duration: totals.duration + activity.duration,
        calories: totals.calories + activity.calories,
      }),
      { steps: 0, duration: 0, calories: 0 }
    );
}

function setProgress(element, value, goal) {
  const percent = Math.min(100, Math.round((value / goal) * 100));
  element.style.width = `${Number.isFinite(percent) ? percent : 0}%`;
}

function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

function getWeeklyData() {
  const days = getLastSevenDays();
  const labels = days.map((date) =>
    new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${date}T00:00:00`))
  );

  const totalsByDay = days.map((date) => {
    return activities
      .filter((activity) => activity.date === date)
      .reduce(
        (totals, activity) => ({
          steps: totals.steps + activity.steps,
          duration: totals.duration + activity.duration,
          calories: totals.calories + activity.calories,
        }),
        { steps: 0, duration: 0, calories: 0 }
      );
  });

  return {
    labels,
    steps: totalsByDay.map((day) => day.steps),
    duration: totalsByDay.map((day) => day.duration),
    calories: totalsByDay.map((day) => day.calories),
  };
}

function updateDashboard() {
  const totals = getTodayTotals();

  totalSteps.textContent = formatNumber(totals.steps);
  totalDuration.textContent = `${formatNumber(totals.duration)} min`;
  totalCalories.textContent = formatNumber(totals.calories);

  setProgress(stepsProgress, totals.steps, GOALS.steps);
  setProgress(durationProgress, totals.duration, GOALS.duration);
  setProgress(caloriesProgress, totals.calories, GOALS.calories);
}

function renderHistory() {
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.date === b.date) return b.createdAt - a.createdAt;
    return b.date.localeCompare(a.date);
  });

  historyBody.innerHTML = sortedActivities
    .map(
      (activity) => `
        <tr>
          <td class="whitespace-nowrap px-5 py-4 font-medium text-slate-800">${formatDate(activity.date)}</td>
          <td class="px-5 py-4 text-slate-600">${activity.type}</td>
          <td class="px-5 py-4 text-slate-600">${formatNumber(activity.duration)} min</td>
          <td class="px-5 py-4 text-slate-600">${formatNumber(activity.calories)}</td>
          <td class="px-5 py-4 text-slate-600">${formatNumber(activity.steps)}</td>
          <td class="px-5 py-4 text-right">
            <button
              class="rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100"
              data-delete-id="${activity.id}"
              type="button"
            >
              Delete
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  const recordText = activities.length === 1 ? "1 record" : `${activities.length} records`;
  historyCount.textContent = activities.length ? recordText : "No records yet";
  emptyState.classList.toggle("hidden", activities.length > 0);
}

function renderChart() {
  const weeklyData = getWeeklyData();
  const chartConfig = {
    type: "bar",
    data: {
      labels: weeklyData.labels,
      datasets: [
        {
          label: "Steps",
          data: weeklyData.steps,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.16)",
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "stepsAxis",
        },
        {
          label: "Minutes",
          data: weeklyData.duration,
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.16)",
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "activityAxis",
        },
        {
          label: "Calories",
          data: weeklyData.calories,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.16)",
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: "activityAxis",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            useBorderRadius: true,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        stepsAxis: {
          beginAtZero: true,
          position: "left",
          ticks: {
            callback: (value) => formatNumber(value),
          },
          title: {
            display: true,
            text: "Steps",
          },
        },
        activityAxis: {
          beginAtZero: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "Minutes / Calories",
          },
        },
      },
    },
  };

  if (progressChart) {
    progressChart.data = chartConfig.data;
    progressChart.options = chartConfig.options;
    progressChart.update();
    return;
  }

  progressChart = new Chart(document.querySelector("#progressChart"), chartConfig);
}

function refreshApp() {
  updateDashboard();
  renderHistory();
  renderChart();
}

function addActivity(event) {
  event.preventDefault();

  const newActivity = {
    id: createActivityId(),
    date: activityDate.value,
    type: exerciseType.value,
    duration: Number(durationInput.value),
    calories: Number(caloriesInput.value),
    steps: Number(stepsInput.value),
    createdAt: Date.now(),
  };

  activities = [newActivity, ...activities];
  saveActivities();
  form.reset();
  activityDate.value = todayIso();
  refreshApp();
}

function deleteActivity(id) {
  activities = activities.filter((activity) => activity.id !== id);
  saveActivities();
  refreshApp();
}

function clearAllActivities() {
  if (!activities.length) return;

  const shouldClear = window.confirm("Delete all saved activity records?");
  if (!shouldClear) return;

  activities = [];
  saveActivities();
  refreshApp();
}

form.addEventListener("submit", addActivity);
clearAllBtn.addEventListener("click", clearAllActivities);
historyBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");
  if (!deleteButton) return;
  deleteActivity(deleteButton.dataset.deleteId);
});

activityDate.value = todayIso();
activities = readActivities();
refreshApp();
