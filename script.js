let input = document.querySelector("#task-input");
let submit = document.querySelector(".add-btn-final");
let tasksDiv = document.querySelector("#tasks-container");
let searchInput = document.querySelector("#search-input");
let progressFill = document.querySelector("#progress-fill");
let progressPercent = document.querySelector("#progress-percent");
let filterBtns = document.querySelectorAll(".filter-btn");
let clearCompletedBtn = document.querySelector("#clear-completed");
let prioritySelect = document.querySelector("#priority-select");
let dueDateInput = document.querySelector("#due-date-input");
let subtitleInput = document.querySelector("#subtitle-input");
let startTimeInput = document.querySelector("#start-time-input");
// Dynamic UI Elements
let sheetTitle = document.querySelector("#sheet-title");
let submitBtn = document.querySelector("#submit-btn");

let arrayOfTasks = [];
let currentFilter = 'all';
let searchQuery = '';
let editingTaskId = null; // Track editing state

// Initial load
getDataFromLocalStorage();

submit.onclick = function (e) {
    e.preventDefault();
    if (input.value.trim() !== "") {
        if (editingTaskId) {
            updateTask(editingTaskId);
        } else {
            addTaskToArray(
                input.value.trim(), 
                prioritySelect.value, 
                dueDateInput.value,
                subtitleInput.value.trim(),
                startTimeInput.value,
                endTimeInput.value
            );
        }
        
        resetForm();
    }
};

function resetForm() {
    input.value = ""; 
    subtitleInput.value = "";
    startTimeInput.value = "";
    endTimeInput.value = "";
    dueDateInput.value = "";
    editingTaskId = null;
    sheetTitle.textContent = "إضافة مهمة جديدة";
    submitBtn.textContent = "حفظ";
}

function openEditModal(taskId) {
    let task = arrayOfTasks.find(t => t.id == taskId);
    if (!task) return;

    editingTaskId = taskId;
    input.value = task.title;
    subtitleInput.value = task.subtitle || "";
    prioritySelect.value = task.priority;
    dueDateInput.value = task.dueDate || "";
    startTimeInput.value = task.startTime || "";
    endTimeInput.value = task.endTime || "";

    sheetTitle.textContent = "تعديل المهمة";
    submitBtn.textContent = "تحديث";
    
    // Scroll to form
    document.querySelector(".form-container").scrollIntoView({ behavior: 'smooth' });
    input.focus();
}

function updateTask(taskId) {
    let index = arrayOfTasks.findIndex(t => t.id == taskId);
    if (index === -1) return;

    arrayOfTasks[index] = {
        ...arrayOfTasks[index],
        title: input.value.trim(),
        subtitle: subtitleInput.value.trim() || null,
        priority: parseInt(prioritySelect.value),
        dueDate: dueDateInput.value || null,
        startTime: startTimeInput.value || null,
        endTime: endTimeInput.value || null
    };

    renderTasks();
    addDataToLocalStorage(arrayOfTasks);
}

// Event delegation for tasks (delete/toggle/edit)
tasksDiv.addEventListener("click", function(e) {
    let target = e.target;
    
    // Check if clicked the delete button or icon
    if (target.classList.contains("del") || target.parentElement.classList.contains("del")) {
        let taskId = target.closest(".task").getAttribute("data-id");
        deleteTaskWith(taskId);
    }
    
    // Check if clicked the edit button or icon
    if (target.classList.contains("edit") || target.parentElement.classList.contains("edit")) {
        let taskId = target.closest(".task").getAttribute("data-id");
        openEditModal(taskId);
    }
    
    // Check if clicked task content or checkbox
    if (target.classList.contains("task-content") || target.classList.contains("task-check") || target.classList.contains("task")) {
        let taskId = target.closest(".task").getAttribute("data-id");
        toggleStatusTaskWith(taskId);
    }
});

// Search Logic
searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTasks();
});

// Filter Logic
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter");
        renderTasks();
    });
});

// Clear Completed
clearCompletedBtn.onclick = () => {
    arrayOfTasks = arrayOfTasks.filter(task => !task.completed);
    addDataToLocalStorage(arrayOfTasks);
    renderTasks();
};

function addTaskToArray(taskText, priority, dueDate, subtitle, startTime, endTime) {
    const task = {
        id: Date.now(),
        title: taskText,
        subtitle: subtitle || null,
        startTime: startTime || null,
        endTime: endTime || null,
        completed: false,
        priority: parseInt(priority),
        dueDate: dueDate || null,
        createdAt: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' })
    };
    arrayOfTasks.push(task);
    renderTasks();
    addDataToLocalStorage(arrayOfTasks);
}

function renderTasks() {
    tasksDiv.innerHTML = "";
    
    // Sorting: 1. Incomplete first, 2. Priority High to Low, 3. Date nearest first
    let sortedTasks = [...arrayOfTasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        return b.id - a.id;
    });

    let filtered = sortedTasks.filter(task => {
        let matchesFilter = currentFilter === 'all' || 
                           (currentFilter === 'active' && !task.completed) || 
                           (currentFilter === 'completed' && task.completed);
        let matchesSearch = task.title.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        tasksDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>${searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد مهام حالياً'}</p>
            </div>
        `;
    } else {
        filtered.forEach((task) => {
            let isLate = task.dueDate && !task.completed && new Date(task.dueDate) < new Date().setHours(0,0,0,0);
            let priorityLabel = task.priority === 3 ? 'هام جداً' : task.priority === 2 ? 'متوسط' : 'عادي';
            
            let div = document.createElement("div");
            div.className = `task ${task.completed ? 'done' : ''}`;
            div.setAttribute("data-id", task.id);

            div.innerHTML = `
                <div class="task-check"></div>
                <div class="task-content">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px;">${task.title}</span>
                        <span class="priority-tag priority-${task.priority}">${priorityLabel}</span>
                    </div>
                    ${task.subtitle ? `<div class="task-subtitle">${task.subtitle}</div>` : ''}
                    <div class="task-meta">
                        <span><i class="far fa-clock"></i> <span dir="ltr">${task.createdAt}</span></span>
                        ${(task.startTime || task.endTime) ? `
                            <span class="time-range" dir="ltr">
                                <i class="fas fa-history"></i> ${task.startTime || '--:--'} - ${task.endTime || '--:--'}
                            </span>
                        ` : ''}
                        ${task.dueDate ? `
                            <span class="due-date-text ${isLate ? 'late-badge' : ''}">
                                <i class="far fa-calendar-alt"></i> <span dir="ltr">${new Date(task.dueDate).toLocaleDateString('en-GB')}</span>
                                ${isLate ? ' (متأخر)' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="edit"><i class="fas fa-edit"></i></div>
                <div class="del"><i class="fas fa-trash-alt"></i></div>
            `;
            tasksDiv.appendChild(div);
        });
    }
    
    updateProgress();
}

function updateProgress() {
    if (arrayOfTasks.length === 0) {
        progressFill.style.width = "0%";
        progressPercent.textContent = "0%";
        return;
    }
    let completed = arrayOfTasks.filter(t => t.completed).length;
    let percent = Math.round((completed / arrayOfTasks.length) * 100);
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
}

function addDataToLocalStorage(arrayOfTasks) {
    window.localStorage.setItem("tasks", JSON.stringify(arrayOfTasks));
}

function getDataFromLocalStorage() {
    let data = window.localStorage.getItem("tasks");
    if (data) {
        arrayOfTasks = JSON.parse(data);
        renderTasks();
    }
}

function deleteTaskWith(taskId) {
    arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
    addDataToLocalStorage(arrayOfTasks);
    renderTasks();
}

function toggleStatusTaskWith(taskId) {
    for (let i = 0; i < arrayOfTasks.length; i++) {
        if (arrayOfTasks[i].id == taskId) {
            arrayOfTasks[i].completed = !arrayOfTasks[i].completed;
            
            if (arrayOfTasks[i].completed) {
                // Play sound
                successSound.currentTime = 0;
                successSound.play().catch(() => {});

                // Basic Confetti for one task
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

                // Check for all tasks completion
                const allDone = arrayOfTasks.length > 0 && arrayOfTasks.every(t => t.completed);
                if (allDone) {
                    setTimeout(() => {
                        const duration = 3 * 1000;
                        const end = Date.now() + duration;

                        (function frame() {
                            confetti({
                                particleCount: 5,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0 },
                                colors: ['#6366f1', '#10b981', '#f59e0b']
                            });
                            confetti({
                                particleCount: 5,
                                angle: 120,
                                spread: 55,
                                origin: { x: 1 },
                                colors: ['#6366f1', '#10b981', '#f59e0b']
                            });

                            if (Date.now() < end) {
                                requestAnimationFrame(frame);
                            }
                        }());
                    }, 500);
                }
            }
        }
    }
    addDataToLocalStorage(arrayOfTasks);
    renderTasks();
}

// --- PWA Installation & Offline Support ---
let deferredPrompt;
let installBanner, installBtn;

window.addEventListener('DOMContentLoaded', () => {
    installBanner = document.querySelector("#pwa-install-banner");
    installBtn = document.querySelector("#pwa-install-btn");

    // Debug tool for User
    window.showInstallBanner = () => {
        if (installBanner) installBanner.style.display = 'flex';
        console.log('Install banner forced to show ✅');
    };

    // 3. Handle Install Button click
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (installBanner) installBanner.style.display = 'none';
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    deferredPrompt = null;
                });
            }
        });
    }
});

// 1. Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.log('Service Worker failed', err));
    });
}

// 2. Listen for 'beforeinstallprompt'
window.addEventListener('beforeinstallprompt', (e) => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
    if (installBanner) installBanner.style.display = 'none';
});
