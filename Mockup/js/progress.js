let activityChartInstance = null;
let nutritionChartInstance = null;
let weightChartInstance = null;

const MOCK_DATA = {
	weightLog: JSON.parse(
		localStorage.getItem("weightLog") ||
			'[{"date":"2023-10-01","weight":75},{"date":"2023-10-15","weight":74.5},{"date":"2023-11-01","weight":74}]'
	),
	mealHistory: JSON.parse(localStorage.getItem("mealHistory") || "[]"),
	exerciseHistory: JSON.parse(
		localStorage.getItem("exerciseHistory") || "[]"
	),
	profile: JSON.parse(localStorage.getItem("userProfile") || "{}"),
	goals: JSON.parse(localStorage.getItem("userGoals") || "[]"),
	achievements: JSON.parse(
		localStorage.getItem("userAchievements") ||
			'[{"name":"10k Steps Milestone","date":"Yesterday","icon":"","color":"--accent-green"},{"name":"Perfect Week","date":"3 days ago","icon":"","color":"--primary-color"}]'
	),
};

function saveMockData() {
	localStorage.setItem("weightLog", JSON.stringify(MOCK_DATA.weightLog));
	localStorage.setItem("mealHistory", JSON.stringify(MOCK_DATA.mealHistory));
	localStorage.setItem(
		"exerciseHistory",
		JSON.stringify(MOCK_DATA.exerciseHistory)
	);
	localStorage.setItem(
		"userAchievements",
		JSON.stringify(MOCK_DATA.achievements)
	);
}

const chartDefaultOptions = (isDarkMode = false) => ({
	responsive: true,
	maintainAspectRatio: false,
	interaction: { intersect: false, mode: "index" },
	scales: {
		x: {
			type: "time",
			time: { unit: "day" },
			grid: { display: false },
			ticks: { color: getCssVariable("--text-secondary") },
		},
		y: {
			beginAtZero: true,
			grid: { color: getCssVariable("--border-color") },
			ticks: { color: getCssVariable("--text-secondary") },
		},
	},
	plugins: {
		legend: {
			display: false,
			labels: { color: getCssVariable("--text-primary") },
		},
		tooltip: {
			enabled: true,
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			titleColor: "#ffffff",
			bodyColor: "#ffffff",
		},
	},
	elements: {
		point: {
			radius: 3,
			hoverRadius: 5,
			backgroundColor: getCssVariable("--primary-color"),
		},
		line: {
			borderColor: getCssVariable("--primary-color"),
			tension: 0.3,
		},
	},
});

function updateActivityChart() {
	const period = document.getElementById("activityTrendPeriod").value;
	const statType = document.getElementById("activityStatType").value;
	const { startDate, endDate } = getDateRange(period);
	const ctx = document.getElementById("activityChart")?.getContext("2d");
	if (!ctx) return;

	const filteredData = MOCK_DATA.exerciseHistory.filter((entry) => {
		const entryDate = entry.exercise_date
			? new Date(entry.exercise_date + "T00:00:00")
			: null;
		return entryDate && entryDate >= startDate && entryDate <= endDate;
	});

	const aggregatedData = {};
	filteredData.forEach((entry) => {
		const dateStr = entry.exercise_date;
		if (!aggregatedData[dateStr])
			aggregatedData[dateStr] = {
				steps: 0,
				duration: 0,
				distance: 0,
				count: 0,
			};

		let value = 0;
		const dailyLog = JSON.parse(
			localStorage.getItem(`dailyLog_${dateStr}`) || "{}"
		);

		switch (statType) {
			case "steps":
				if (dailyLog.steps !== undefined) {
					value = dailyLog.steps;
				} else if (
					entry.exercise_type.toLowerCase() === "walking" ||
					entry.exercise_type.toLowerCase() === "running"
				) {
					value =
						(parseFloat(entry.exercise_distance) || 0) *
						(entry.exercise_distance_unit === "km" ? 1250 : 2000);
				}
				break;
			case "duration":
				value = parseFloat(entry.exercise_duration) || 0;
				break;
			case "distance":
				if (entry.exercise_type.toLowerCase() === "running") {
					let distKm = parseFloat(entry.exercise_distance) || 0;
					if (entry.exercise_distance_unit === "miles")
						distKm *= 1.609;
					else if (entry.exercise_distance_unit === "meters")
						distKm /= 1000;
					else if (entry.exercise_distance_unit === "yards")
						distKm *= 0.0009144;
					value = distKm;
				}
				break;
		}
		if (statType === "steps") {
			aggregatedData[dateStr][statType] = Math.max(
				aggregatedData[dateStr][statType] || 0,
				value
			);
		} else {
			aggregatedData[dateStr][statType] =
				(aggregatedData[dateStr][statType] || 0) + value;
		}
		aggregatedData[dateStr].count++;
	});

	const chartData = Object.entries(aggregatedData)
		.map(([date, values]) => ({ x: date, y: values[statType] || 0 }))
		.sort((a, b) => new Date(a.x) - new Date(b.x));

	const primaryColor = getCssVariable("--primary-color");

	if (activityChartInstance) activityChartInstance.destroy();
	activityChartInstance = new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					label: statType.charAt(0).toUpperCase() + statType.slice(1),
					data: chartData,
					borderColor: primaryColor,
					backgroundColor: primaryColor + "1A",
					fill: true,
					tension: 0.3,
					pointBackgroundColor: primaryColor,
				},
			],
		},
		options: {
			...chartDefaultOptions(),
			scales: {
				...chartDefaultOptions().scales,
				y: { ...chartDefaultOptions().scales.y, beginAtZero: true },
				x: {
					...chartDefaultOptions().scales.x,
					time: { unit: period === "1y" ? "month" : "day" },
				},
			},
		},
	});

	let totalSteps = 0,
		totalDuration = 0,
		totalDist = 0;
	const days = new Set(Object.keys(aggregatedData));
	Object.values(aggregatedData).forEach((dayData) => {
		totalSteps += dayData.steps || 0;
		totalDuration += dayData.duration || 0;
		totalDist += dayData.distance || 0;
	});

	const numDays = days.size || 1;
	document.getElementById("avgSteps").textContent = Math.round(
		totalSteps / numDays
	).toLocaleString();
	document.getElementById("avgExercise").textContent = `${Math.round(
		totalDuration / numDays
	)} min`;
	document.getElementById("totalDistance").textContent = `${totalDist.toFixed(
		1
	)} km`;
	document.getElementById("activeDays").textContent = `${days.size} days`;
}

function updateNutritionChart() {
	const period = document.getElementById("nutritionTrendPeriod").value;
	const chartType = document.getElementById("nutritionChartType").value;
	const { startDate, endDate } = getDateRange(period);
	const ctx = document.getElementById("nutritionChart")?.getContext("2d");
	if (!ctx) return;

	const filteredData = MOCK_DATA.mealHistory.filter((entry) => {
		const entryDate = entry.date
			? new Date(entry.date + "T00:00:00")
			: null;
		return entryDate && entryDate >= startDate && entryDate <= endDate;
	});

	let totalCalories = 0,
		totalProtein = 0,
		totalCarbs = 0,
		totalFat = 0;
	const daysCounted = new Set(filteredData.map((e) => e.date)).size || 1;

	filteredData.forEach((meal) => {
		totalCalories += meal.summary?.calories || 0;
		totalProtein += meal.summary?.protein || 0;
		totalCarbs += meal.summary?.carbs || 0;
		totalFat += meal.summary?.fat || 0;
	});

	const avgCalories = Math.round(totalCalories / daysCounted);
	const avgProtein = Math.round(totalProtein / daysCounted);
	const avgCarbs = Math.round(totalCarbs / daysCounted);
	const avgFat = Math.round(totalFat / daysCounted);

	document.getElementById(
		"avgCalories"
	).textContent = `${avgCalories.toLocaleString()} kcal`;
	document.getElementById("avgProtein").textContent = `${avgProtein} g`;
	document.getElementById("avgCarbs").textContent = `${avgCarbs} g`;
	document.getElementById("avgFat").textContent = `${avgFat} g`;

	const accentRed = getCssVariable("--accent-red");
	const accentGreen = getCssVariable("--accent-green");
	const accentTeal = getCssVariable("--accent-teal");

	if (nutritionChartInstance) nutritionChartInstance.destroy();

	if (chartType === "calories") {
		const aggregatedData = {};
		filteredData.forEach((entry) => {
			const dateStr = entry.date;
			aggregatedData[dateStr] =
				(aggregatedData[dateStr] || 0) + (entry.summary?.calories || 0);
		});
		const chartData = Object.entries(aggregatedData)
			.map(([date, value]) => ({ x: date, y: value }))
			.sort((a, b) => new Date(a.x) - new Date(b.x));

		nutritionChartInstance = new Chart(ctx, {
			type: "bar",
			data: {
				datasets: [
					{
						label: "Daily Calories",
						data: chartData,
						backgroundColor: accentRed,
						borderColor: accentRed,
					},
				],
			},
			options: {
				...chartDefaultOptions(),
				scales: {
					...chartDefaultOptions().scales,
					y: { ...chartDefaultOptions().scales.y, beginAtZero: true },
					x: {
						...chartDefaultOptions().scales.x,
						time: { unit: period === "90d" ? "week" : "day" },
					},
				},
			},
		});
	} else {
		nutritionChartInstance = new Chart(ctx, {
			type: "doughnut",
			data: {
				labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
				datasets: [
					{
						label: "Avg Macros",
						data: [avgProtein, avgCarbs, avgFat],
						backgroundColor: [accentGreen, accentTeal, accentRed],
						borderColor: getCssVariable("--surface-color"),
						borderWidth: 2,
						hoverOffset: 4,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: "bottom",
						labels: { color: getCssVariable("--text-primary") },
					},
					tooltip: chartDefaultOptions().plugins.tooltip,
				},
			},
		});
	}
}

function updateWeightChart() {
	const period = document.getElementById("weightTrendPeriod").value;
	const { startDate, endDate } = getDateRange(period);
	const ctx = document.getElementById("weightChart")?.getContext("2d");
	if (!ctx) return;

	const filteredData = MOCK_DATA.weightLog
		.filter((entry) => {
			const entryDate = entry.date
				? new Date(entry.date + "T00:00:00")
				: null;
			return entryDate && entryDate >= startDate && entryDate <= endDate;
		})
		.sort((a, b) => new Date(a.date) - new Date(b.date));

	const chartData = filteredData.map((entry) => ({
		x: entry.date,
		y: entry.weight,
	}));

	const accentRed = getCssVariable("--accent-red");

	if (weightChartInstance) weightChartInstance.destroy();
	weightChartInstance = new Chart(ctx, {
		type: "line",
		data: {
			datasets: [
				{
					label: "Weight (kg)",
					data: chartData,
					borderColor: accentRed,
					backgroundColor: accentRed + "1A",
					fill: false,
					tension: 0.1,
					pointBackgroundColor: accentRed,
				},
			],
		},
		options: {
			...chartDefaultOptions(),
			scales: {
				...chartDefaultOptions().scales,
				y: { ...chartDefaultOptions().scales.y, beginAtZero: false },
				x: {
					...chartDefaultOptions().scales.x,
					time: {
						unit:
							period === "1y" ||
							period === "all" ||
							period === "6m"
								? "month"
								: period === "90d"
								? "week"
								: "day",
					},
				},
			},
		},
	});

	const currentWeight =
		filteredData.length > 0
			? filteredData[filteredData.length - 1].weight
			: MOCK_DATA.profile.weight_kg || "--";
	const startWeight = filteredData.length > 0 ? filteredData[0].weight : null;
	const weightChange =
		startWeight !== null && currentWeight !== "--"
			? (currentWeight - startWeight).toFixed(1)
			: "--";
	const profileHeight = MOCK_DATA.profile.height_cm;
	const bmi =
		currentWeight !== "--" && profileHeight && profileHeight > 0
			? (currentWeight / (profileHeight / 100) ** 2).toFixed(1)
			: "--";
	const weightGoal =
		MOCK_DATA.goals.find((g) => g.type === "weight")?.targetValue || "--";

	document.getElementById(
		"currentWeight"
	).textContent = `${currentWeight} kg`;
	document.getElementById("weightChange").textContent = `${weightChange} kg`;
	document.getElementById("bmi").textContent = bmi;
	document.getElementById("weightGoal").textContent = `${weightGoal} kg`;
}

function logWeight() {
	const today = new Date().toISOString().split("T")[0];
	const latestWeightEntry =
		MOCK_DATA.weightLog.length > 0
			? MOCK_DATA.weightLog[MOCK_DATA.weightLog.length - 1]
			: null;
	const currentWeightSuggest = latestWeightEntry
		? latestWeightEntry.weight
		: MOCK_DATA.profile.weight_kg || "";

	const weightStr = prompt(
		`Enter current weight (kg) for ${today}:`,
		currentWeightSuggest
	);
	const weight = parseFloat(weightStr);

	if (!isNaN(weight) && weight > 0) {
		const existingIndex = MOCK_DATA.weightLog.findIndex(
			(e) => e.date === today
		);
		if (existingIndex > -1) {
			MOCK_DATA.weightLog[existingIndex].weight = weight;
		} else {
			MOCK_DATA.weightLog.push({ date: today, weight: weight });
			MOCK_DATA.weightLog.sort(
				(a, b) => new Date(a.date) - new Date(b.date)
			);
		}
		MOCK_DATA.profile.weight_kg = weight;
		localStorage.setItem("userProfile", JSON.stringify(MOCK_DATA.profile));

		saveMockData();
		updateWeightChart();
	} else if (weightStr !== null && weightStr !== "") {
		alert("Invalid weight entered. Please enter a positive number.");
	}
}

function loadAchievements() {
	const list = document.getElementById("achievementsList");
	const noAchievementsMsg = document.getElementById("noAchievements");
	if (!list || !noAchievementsMsg) return;

	list.innerHTML = "";
	if (MOCK_DATA.achievements.length === 0) {
		noAchievementsMsg.classList.remove("d-none");
	} else {
		noAchievementsMsg.classList.add("d-none");
		const limitedAchievements = MOCK_DATA.achievements.slice(0, 2);
		limitedAchievements.forEach((ach) => {
			const iconColor = ach.color
				? getCssVariable(ach.color)
				: getCssVariable("--primary-color");
			const item = document.createElement("li");
			item.classList.add("achievement-item");
			item.innerHTML = `
                <span class="achievement-icon" style="color: ${iconColor}"></span>
                <div class="achievement-details">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-date">Achieved: ${ach.date}</div>
                </div>`;
			list.appendChild(item);
		});
	}
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
	MOCK_DATA.profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
	MOCK_DATA.goals = JSON.parse(localStorage.getItem("userGoals") || "[]");
	MOCK_DATA.weightLog = JSON.parse(
		localStorage.getItem("weightLog") || "[]"
	).sort((a, b) => new Date(a.date) - new Date(b.date));

	updateActivityChart();
	updateNutritionChart();
	updateWeightChart();
	loadAchievements();
});
