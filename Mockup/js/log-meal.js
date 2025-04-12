function saveMeal() {
	const foodItems = document.querySelectorAll("#foodList .food-item");
	if (foodItems.length === 0) {
		alert("Please add at least one food item before saving.");
		return;
	}

	const mealDateInput = document.getElementById("meal-date");
	const mealTimeInput = document.getElementById("meal-time");
	const mealTypeInput = document.getElementById("meal-type");

	const mealDate = mealDateInput.value;
	const mealTime = mealTimeInput.value;
	const mealType = mealTypeInput.value;

	if (!mealDate || !mealTime || !mealType) {
		alert("Please ensure Date, Time, and Meal Type are selected.");
		return;
	}

	const summaryCalories =
		parseFloat(
			document.querySelector('[data-summary="calories"]').textContent
		) || 0;
	const summaryProtein =
		parseFloat(
			document.querySelector('[data-summary="protein"]').textContent
		) || 0;
	const summaryCarbs =
		parseFloat(
			document.querySelector('[data-summary="carbs"]').textContent
		) || 0;
	const summaryFat =
		parseFloat(
			document.querySelector('[data-summary="fat"]').textContent
		) || 0;

	const mealData = {
		id: Date.now(),
		date: mealDate,
		time: mealTime,
		type: mealType,
		items: [],
		summary: {
			calories: summaryCalories,
			protein: summaryProtein,
			carbs: summaryCarbs,
			fat: summaryFat,
		},
	};

	foodItems.forEach((item) => {
		mealData.items.push({
			name:
				item.dataset.name ||
				item.querySelector(".food-item-name").textContent,
			portion: item.dataset.portion || "",
			details: item.querySelector(".food-item-details").textContent,
			calories: parseFloat(item.dataset.calories) || 0,
			protein: parseFloat(item.dataset.protein) || 0,
			carbs: parseFloat(item.dataset.carbs) || 0,
			fat: parseFloat(item.dataset.fat) || 0,
		});
	});

	try {
		let history = JSON.parse(localStorage.getItem("mealHistory") || "[]");
		history.push(mealData);
		localStorage.setItem("mealHistory", JSON.stringify(history));

		const dateStr = mealData.date;
		let dailyLog = JSON.parse(
			localStorage.getItem(`dailyLog_${dateStr}`) || "{}"
		);
		dailyLog.kcal = (dailyLog.kcal || 0) + mealData.summary.calories;
		localStorage.setItem(`dailyLog_${dateStr}`, JSON.stringify(dailyLog));

		alert("Meal Saved!");
		document.getElementById("foodList").innerHTML = "";
		document.getElementById("log-meal-form").reset();
		document.getElementById("food-name").value = "";
		document.getElementById("food-portion").value = "";
		document.getElementById("food-calories").value = "";
		document.getElementById("food-protein").value = "";
		document.getElementById("food-carbs").value = "";
		document.getElementById("food-fat").value = "";

		updateSummary();
		setDefaultDateTime("meal-date", "meal-time");
	} catch (e) {
		console.error("Error saving meal:", e);
		alert("Error saving meal. Check console for details.");
	}
}

function addFoodItem() {
	const nameInput = document.getElementById("food-name");
	const portionInput = document.getElementById("food-portion");
	const caloriesInput = document.getElementById("food-calories");
	const proteinInput = document.getElementById("food-protein");
	const carbsInput = document.getElementById("food-carbs");
	const fatInput = document.getElementById("food-fat");

	const name = nameInput.value.trim();
	const portion = portionInput.value.trim();
	const calories = parseFloat(caloriesInput.value) || 0;
	const protein = parseFloat(proteinInput.value) || 0;
	const carbs = parseFloat(carbsInput.value) || 0;
	const fat = parseFloat(fatInput.value) || 0;

	if (!name) {
		alert("Please enter a Food Name.");
		nameInput.focus();
		return;
	}
	if (calories <= 0) {
		alert("Please enter the Calories (kcal) for the food item.");
		caloriesInput.focus();
		return;
	}

	const list = document.getElementById("foodList");
	if (list) {
		const newItem = document.createElement("li");
		newItem.classList.add("food-item");
		newItem.dataset.name = name;
		newItem.dataset.portion = portion;
		newItem.dataset.calories = calories;
		newItem.dataset.protein = protein;
		newItem.dataset.carbs = carbs;
		newItem.dataset.fat = fat;

		let detailsStr = `${portion ? portion + " - " : ""}${calories} kcal`;

		newItem.innerHTML = `
            <div class="food-item-info">
                <span class="food-item-name">${name}</span>
                <span class="food-item-details">${detailsStr}</span>
            </div>
            <button class="remove-item-btn" onclick="removeItem(this)" title="Remove Item">×</button>`;
		list.appendChild(newItem);

		nameInput.value = "";
		portionInput.value = "";
		caloriesInput.value = "";
		proteinInput.value = "";
		carbsInput.value = "";
		fatInput.value = "";

		updateSummary();
		nameInput.focus();
	}
}

function removeItem(button) {
	const listItem = button.closest(".food-item");
	if (listItem) {
		listItem.remove();
		updateSummary();
	}
}

function updateSummary() {
	const items = document.querySelectorAll("#foodList .food-item");
	let totalCalories = 0,
		totalProtein = 0,
		totalCarbs = 0,
		totalFat = 0;

	items.forEach((item) => {
		totalCalories += parseFloat(item.dataset.calories) || 0;
		totalProtein += parseFloat(item.dataset.protein) || 0;
		totalCarbs += parseFloat(item.dataset.carbs) || 0;
		totalFat += parseFloat(item.dataset.fat) || 0;
	});

	document.querySelector('[data-summary="calories"]').textContent =
		Math.round(totalCalories);
	document.querySelector('[data-summary="protein"]').textContent =
		Math.round(totalProtein * 10) / 10 + "g";
	document.querySelector('[data-summary="carbs"]').textContent =
		Math.round(totalCarbs * 10) / 10 + "g";
	document.querySelector('[data-summary="fat"]').textContent =
		Math.round(totalFat * 10) / 10 + "g";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
	setDefaultDateTime("meal-date", "meal-time");
	updateSummary();
});
