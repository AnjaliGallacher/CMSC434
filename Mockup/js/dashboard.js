let currentFilter = "daily";
let userGoals = [],
	aggregatedData = {};

function loadDashboardData(filterPeriod = "daily") {
	currentFilter = filterPeriod;

	const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
	userGoals = JSON.parse(localStorage.getItem("userGoals") || "[]");
	document.getElementById("userGreeting").textContent = `Hello, ${
		userProfile.username || "User"
	}!`;
	document.getElementById("checklistPeriod").textContent =
		{ daily: "Today", weekly: "This Week", monthly: "This Month" }[
			filterPeriod
		] || "Today";

	aggregatedData = {
		steps: 0,
		exercise: 0,
		kcal: 0,
		water: 0,
		daysInRange: 0,
		goalsMetCount: 0,
		totalActiveGoals: 0,
	};

	const endDate = new Date();
	const startDate = getStartDateForPeriod(filterPeriod, endDate);
	const endStr = getISODateString(endDate);
	const startStr = getISODateString(startDate);

	let currentDate = new Date(startDate),
		daysCount = 0;

	while (getISODateString(currentDate) <= endStr) {
		const dateStr = getISODateString(currentDate);
		const dailyLog = JSON.parse(
			localStorage.getItem(`dailyLog_${dateStr}`) || "{}"
		);

		aggregatedData.steps += dailyLog.steps || 0;
		aggregatedData.exercise += dailyLog.exercise || 0;
		aggregatedData.kcal += dailyLog.kcal || 0;
		aggregatedData.water += dailyLog.water || 0;

		daysCount++;
		currentDate.setDate(currentDate.getDate() + 1);
	}
	aggregatedData.daysInRange = daysCount > 0 ? daysCount : 1;

	aggregatedData.totalActiveGoals = userGoals.filter(
		(g) => g.status !== "completed"
	).length;
	aggregatedData.goalsMetCount = calculateGoalsMet(aggregatedData);

	updateGoalsUI();
	updateStatsUI();
	loadGoalsChecklist();
}

function getStartDateForPeriod(period, endDate) {
	let startDate = new Date(endDate);
	switch (period) {
		case "weekly":
			startDate.setDate(startDate.getDate() - 6);
			break;
		case "monthly":
			startDate.setDate(1);
			break;
	}
	return startDate;
}

function updateGoalsUI() {
	const stepsGoal =
		userGoals.find((g) => g.type === "steps")?.targetValue || 10000;
	const exerciseGoal =
		userGoals.find((g) => g.type === "exercise_duration")?.targetValue ||
		60;
	const kcalGoal =
		userGoals.find((g) => g.type === "calories")?.targetValue || 2000;
	const waterGoal =
		userGoals.find((g) => g.type === "water")?.targetValue || 2000;

	document.getElementById("goalSteps").textContent =
		parseInt(stepsGoal).toLocaleString();
	document.getElementById("goalExercise").textContent =
		parseInt(exerciseGoal);
	document.getElementById("goalKcal").textContent =
		parseInt(kcalGoal).toLocaleString();
	document.getElementById("goalWater").textContent = (
		parseInt(waterGoal) / 1000
	).toFixed(1);
}

function updateStatsUI() {
	let displaySteps, displayExercise, displayKcal, displayWater;
	let stepsLabel, exerciseLabel, kcalLabel, waterLabel, goalsLabel;

	if (currentFilter === "daily") {
		displaySteps = aggregatedData.steps;
		displayExercise = aggregatedData.exercise;
		displayKcal = aggregatedData.kcal;
		displayWater = aggregatedData.water;

		stepsLabel = `Goal: <span id="goalSteps">${
			document.getElementById("goalSteps").textContent
		}</span> steps`;
		exerciseLabel = `Goal: <span id="goalExercise">${
			document.getElementById("goalExercise").textContent
		}</span> min active`;
		kcalLabel = `Goal: <span id="goalKcal">${
			document.getElementById("goalKcal").textContent
		}</span> kcal`;
		waterLabel = `Goal: <span id="goalWater">${
			document.getElementById("goalWater").textContent
		}</span> L`;
		goalsLabel = "Active Goals Met Today";
	} else {
		const avgDivisor = aggregatedData.daysInRange;
		displaySteps = Math.round(aggregatedData.steps / avgDivisor);
		displayExercise = Math.round(aggregatedData.exercise / avgDivisor);
		displayKcal = Math.round(aggregatedData.kcal / avgDivisor);
		displayWater = aggregatedData.water / avgDivisor;

		const periodLabel =
			currentFilter === "weekly" ? "Week Avg" : "Month Avg";
		stepsLabel = `Goal: <span id="goalSteps">${
			document.getElementById("goalSteps").textContent
		}</span> steps (${periodLabel})`;
		exerciseLabel = `Goal: <span id="goalExercise">${
			document.getElementById("goalExercise").textContent
		}</span> min (${periodLabel})`;
		kcalLabel = `Goal: <span id="goalKcal">${
			document.getElementById("goalKcal").textContent
		}</span> kcal (${periodLabel})`;
		waterLabel = `Goal: <span id="goalWater">${
			document.getElementById("goalWater").textContent
		}</span> L (${periodLabel})`;
		goalsLabel = `Avg Goals Met / Day (${
			currentFilter === "weekly" ? "Week" : "Month"
		})`;
	}

	document.getElementById("statSteps").textContent =
		displaySteps.toLocaleString();
	document.getElementById("statExercise").textContent = displayExercise;
	document.getElementById("statKcal").textContent =
		displayKcal.toLocaleString();
	document.getElementById("statWater").textContent = (
		displayWater / 1000
	).toFixed(1);

	document.getElementById("statStepsLabel").innerHTML = stepsLabel;
	document.getElementById("statExerciseLabel").innerHTML = exerciseLabel;
	document.getElementById("statKcalLabel").innerHTML = kcalLabel;
	document.getElementById("statWaterLabel").innerHTML = waterLabel;
	document.getElementById("statGoalsLabel").textContent = goalsLabel;

	const stepsGoalVal =
		parseInt(
			document.getElementById("goalSteps").textContent.replace(/,/g, "")
		) || 1;
	const exerciseGoalVal =
		parseInt(document.getElementById("goalExercise").textContent) || 1;
	const kcalGoalVal =
		parseInt(
			document.getElementById("goalKcal").textContent.replace(/,/g, "")
		) || 1;
	const waterGoalVal =
		parseFloat(document.getElementById("goalWater").textContent) * 1000 ||
		1;

	const avgSteps = Math.round(
		aggregatedData.steps / aggregatedData.daysInRange
	);
	const avgExercise = Math.round(
		aggregatedData.exercise / aggregatedData.daysInRange
	);
	const avgKcal = Math.round(
		aggregatedData.kcal / aggregatedData.daysInRange
	);
	const avgWater = Math.round(
		aggregatedData.water / aggregatedData.daysInRange
	);

	updateProgressBar("stepsProgress", avgSteps, stepsGoalVal);
	updateProgressBar("exerciseProgress", avgExercise, exerciseGoalVal);
	updateProgressBar("kcalProgress", avgKcal, kcalGoalVal);
	updateProgressBar("waterProgress", avgWater, waterGoalVal);

	document.getElementById(
		"statGoals"
	).textContent = `${aggregatedData.goalsMetCount} / ${aggregatedData.totalActiveGoals}`;
	updateProgressBar(
		"goalsProgress",
		aggregatedData.goalsMetCount,
		aggregatedData.totalActiveGoals || 1
	);
}

function updateProgressBar(elementId, currentValue, goalValue) {
	const progressBar = document.getElementById(elementId);
	if (!progressBar || goalValue <= 0) {
		if (progressBar) progressBar.style.width = "0%";
		return;
	}
	const percentage = Math.min(
		100,
		Math.max(0, (currentValue / goalValue) * 100)
	);
	progressBar.style.width = `${percentage}%`;
}

function calculateGoalsMet(aggData) {
	let metCount = 0;
	const avgDivisor = aggData.daysInRange;

	userGoals.forEach((goal) => {
		if (goal.status === "completed") return;
		const goalValue = parseFloat(goal.targetValue);
		if (isNaN(goalValue)) return;

		switch (goal.type) {
			case "steps":
				if (aggData.steps / avgDivisor >= goalValue) metCount++;
				break;
			case "exercise_duration":
				if (aggData.exercise / avgDivisor >= goalValue / 7) metCount++;
				break;
			case "water":
				if (aggData.water / avgDivisor >= goalValue) metCount++;
				break;
			case "calories":
				if (aggData.kcal / avgDivisor >= goalValue) metCount++;
				break;
		}
	});
	return metCount;
}

function loadGoalsChecklist() {
	const checklist = document.getElementById("goalsChecklist");
	const noGoalsMsg = document.getElementById("noGoalsToday");
	checklist.innerHTML = "";

	const todayGoals =
		currentFilter === "daily"
			? userGoals.filter(
					(g) =>
						g.status !== "completed" &&
						(g.type === "steps" ||
							g.type === "water" ||
							g.type === "custom" ||
							g.type === "exercise_duration")
			  )
			: [];

	if (todayGoals.length === 0) {
		noGoalsMsg.classList.remove("d-none");
		noGoalsMsg.textContent =
			currentFilter === "daily"
				? "No active goals for today."
				: "Checklist only available in 'Today' view.";
		return;
	}

	noGoalsMsg.classList.add("d-none");
	todayGoals.forEach((goal) => {
		const item = document.createElement("li");
		item.classList.add("goals-checklist-item");
		const isCompleted = checkGoalCompletionStatus(goal.id);
		if (isCompleted) item.classList.add("completed");

		let goalDetailText = "";
		if (goal.targetValue) {
			let unit = "";
			if (goal.type === "steps") unit = "steps";
			else if (goal.type === "water") unit = "mL";
			else if (goal.type === "exercise_duration") unit = "min";
			else if (goal.type === "calories") unit = "kcal";
			else if (goal.type === "weight") unit = "kg";
			goalDetailText = `Target: ${goal.targetValue} ${unit}`;
		}

		item.innerHTML = `
            <input type="checkbox" id="goalCheck_${goal.id}" data-goal-id="${
			goal.id
		}" ${
			isCompleted ? "checked" : ""
		} onchange="toggleGoalCompletion(this)">
            <label for="goalCheck_${goal.id}">
                <div class="goal-name">${goal.name}</div>
                ${
					goalDetailText
						? `<div class="goal-details">${goalDetailText}</div>`
						: ""
				}
            </label>
         `;
		checklist.appendChild(item);
	});
}

function toggleGoalCompletion(checkbox) {
	const goalId = checkbox.dataset.goalId;
	const isCompleted = checkbox.checked;
	const listItem = checkbox.closest(".goals-checklist-item");
	listItem.classList.toggle("completed", isCompleted);

	const todayStr = getISODateString(new Date());
	let completedGoals = JSON.parse(
		localStorage.getItem(`completedGoals_${todayStr}`) || "{}"
	);
	if (isCompleted) {
		completedGoals[goalId] = true;
	} else {
		delete completedGoals[goalId];
	}
	localStorage.setItem(
		`completedGoals_${todayStr}`,
		JSON.stringify(completedGoals)
	);
}

function checkGoalCompletionStatus(goalId) {
	const todayStr = getISODateString(new Date());
	let completedGoals = JSON.parse(
		localStorage.getItem(`completedGoals_${todayStr}`) || "{}"
	);
	return completedGoals[goalId] === true;
}

// Initialize dashboard on page load
document.addEventListener("DOMContentLoaded", () => {
	const timeFiltersContainer = document.getElementById("timeFilters");
	if (timeFiltersContainer) {
		timeFiltersContainer.addEventListener("click", (event) => {
			if (event.target.classList.contains("filter-btn")) {
				const filterButtons =
					timeFiltersContainer.querySelectorAll(".filter-btn");
				filterButtons.forEach((btn) => btn.classList.remove("active"));
				event.target.classList.add("active");
				const newFilter = event.target.dataset.filter;
				loadDashboardData(newFilter);
			}
		});
	}
	loadDashboardData(currentFilter);
});
