function saveExercise() {
	const exTypeInput = document.getElementById("ex-type");
	const exDurationInput = document.getElementById("ex-duration");
	const exDateInput = document.getElementById("ex-date");
	const exTimeInput = document.getElementById("ex-time");

	const exType = exTypeInput.value.trim();
	const exDuration = exDurationInput.value;
	const exDate = exDateInput.value;
	const exTime = exTimeInput.value;

	if (!exType || !exDuration || !exDate || !exTime) {
		alert("Please fill in Exercise Type, Date, Time, and Duration.");
		if (!exType) exTypeInput.focus();
		else if (!exDate) exDateInput.focus();
		else if (!exTime) exTimeInput.focus();
		else if (!exDuration) exDurationInput.focus();
		return;
	}
	if (parseInt(exDuration) <= 0) {
		alert("Duration must be a positive number.");
		exDurationInput.focus();
		return;
	}

	const form = document.getElementById("log-exercise-form");
	const formData = new FormData(form);
	const exerciseData = Object.fromEntries(formData.entries());
	exerciseData.id = Date.now();
	exerciseData.exercise_date =
		exerciseData.exercise_date || getISODateString(new Date());

	try {
		let history = JSON.parse(
			localStorage.getItem("exerciseHistory") || "[]"
		);
		history.push(exerciseData);
		localStorage.setItem("exerciseHistory", JSON.stringify(history));

		// Update daily log for date
		const dateStr = exerciseData.exercise_date;
		let dailyLog = JSON.parse(
			localStorage.getItem(`dailyLog_${dateStr}`) || "{}"
		);
		dailyLog.exercise =
			(dailyLog.exercise || 0) + parseInt(exerciseData.exercise_duration);

		// If it's a walking or running exercise, update steps too
		const exTypeLC = exType.toLowerCase();
		if (exTypeLC === "walking" || exTypeLC === "running") {
			let stepsEstimate = 0;
			if (
				exerciseData.exercise_distance &&
				exerciseData.exercise_distance_unit
			) {
				const distance = parseFloat(exerciseData.exercise_distance);
				if (!isNaN(distance) && distance > 0) {
					const stepsPerUnit =
						exerciseData.exercise_distance_unit === "km"
							? 1250
							: 2000; // 1250 steps per km, 2000 per mile
					stepsEstimate = Math.round(distance * stepsPerUnit);
				}
			}
			dailyLog.steps = Math.max(dailyLog.steps || 0, stepsEstimate); // Only update if estimate is higher than current
		}

		localStorage.setItem(`dailyLog_${dateStr}`, JSON.stringify(dailyLog));
		alert("Exercise logged successfully!");
		form.reset();
		setDefaultDateTime("ex-date", "ex-time");
	} catch (e) {
		console.error("Error saving exercise:", e);
		alert("Error saving exercise. Please try again.");
	}
}

function updateCalorieField() {
	const exType = document
		.getElementById("ex-type")
		.value.trim()
		.toLowerCase();
	const duration =
		parseInt(document.getElementById("ex-duration").value) || 0;

	let calsPerHour = 0;
	switch (exType) {
		case "running":
			calsPerHour = 600;
			break;
		case "walking":
			calsPerHour = 300;
			break;
		case "cycling":
			calsPerHour = 400;
			break;
		case "swimming":
			calsPerHour = 500;
			break;
		case "yoga":
			calsPerHour = 250;
			break;
		case "strength training":
			calsPerHour = 350;
			break;
		default:
			calsPerHour = 350; // Default estimate
	}

	const caloriesBurned = Math.round((calsPerHour / 60) * duration);
	document.getElementById("ex-calories").value = caloriesBurned;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
	setDefaultDateTime("ex-date", "ex-time");

	const typeInput = document.getElementById("ex-type");
	const durationInput = document.getElementById("ex-duration");

	if (typeInput && durationInput) {
		typeInput.addEventListener("change", updateCalorieField);
		durationInput.addEventListener("input", updateCalorieField);
	}
});
