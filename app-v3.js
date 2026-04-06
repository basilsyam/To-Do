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
let endTimeInput = document.querySelector("#end-time-input");
// Dynamic UI Elements
let sheetTitle = document.querySelector("#sheet-title");
let submitBtn = document.querySelector("#submit-btn");

// Custom Dropdown Elements
const dropdownWrapper = document.querySelector(".custom-select-wrapper");
const dropdownTrigger = document.querySelector(".custom-select-trigger");
const dropdownOptions = document.querySelectorAll(".custom-option");
const selectedText = document.querySelector("#selected-priority-text");
const hiddenPriorityInput = document.querySelector("#priority-select");

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
            showToast("تم تحديث المهمة بنجاح", "success");
        } else {
            addTaskToArray(
                input.value.trim(), 
                prioritySelect.value, 
                dueDateInput.value,
                subtitleInput.value.trim(),
                startTimeInput.value,
                endTimeInput.value
            );
            showToast("تم إضافة المهمة بنجاح", "success");
        }
        
        resetForm();
    }
};

function showToast(message, icon) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    Toast.fire({
        icon: icon,
        title: message
    });
}

function resetForm() {
    input.value = ""; 
    subtitleInput.value = "";
    startTimeInput.value = "";
    endTimeInput.value = "";
    dueDateInput.value = "";
    editingTaskId = null;
    sheetTitle.textContent = "إضافة مهمة جديدة";
    submitBtn.textContent = "حفظ";
    
    // Reset Custom Dropdown
    hiddenPriorityInput.value = "2";
    selectedText.textContent = "متوسطة 🟡";
    dropdownOptions.forEach(opt => {
        opt.classList.remove("selected");
        if (opt.getAttribute("data-value") == "2") opt.classList.add("selected");
    });

    syncDisplays(); // Update visual displays
}

function syncDisplays() {
    const dView = document.querySelector("#due-date-display");
    const sView = document.querySelector("#start-time-display");
    const eView = document.querySelector("#end-time-display");

    if (dueDateInput.value) {
        const d = new Date(dueDateInput.value);
        dView.textContent = d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    } else {
        dView.textContent = "اختيار التاريخ...";
    }

    sView.textContent = startTimeInput.value || "--:--";
    eView.textContent = endTimeInput.value || "--:--";
}

// Sync on input
[dueDateInput, startTimeInput, endTimeInput].forEach(el => {
    el.addEventListener('input', syncDisplays);
});

// Custom Dropdown Logic
if (dropdownTrigger) {
    dropdownTrigger.onclick = (e) => {
        e.stopPropagation();
        dropdownWrapper.classList.toggle("open");
    };
}

dropdownOptions.forEach(option => {
    option.onclick = () => {
        const val = option.getAttribute("data-value");
        const text = option.textContent;
        
        // Update selection
        hiddenPriorityInput.value = val;
        selectedText.textContent = text;
        
        // Update active class
        dropdownOptions.forEach(opt => opt.classList.remove("selected"));
        option.classList.add("selected");
        
        // Close
        dropdownWrapper.classList.remove("open");
    };
});

// Close on outside click
document.addEventListener("click", () => {
    if (dropdownWrapper) dropdownWrapper.classList.remove("open");
});

function openEditModal(taskId) {
    let task = arrayOfTasks.find(t => t.id == taskId);
    if (!task) return;

    editingTaskId = taskId;
    input.value = task.title;
    subtitleInput.value = task.subtitle || "";
    
    // Update Custom Dropdown for Edit
    hiddenPriorityInput.value = task.priority;
    const currentOption = Array.from(dropdownOptions).find(opt => opt.getAttribute("data-value") == task.priority);
    if (currentOption) {
        selectedText.textContent = currentOption.textContent;
        dropdownOptions.forEach(opt => opt.classList.remove("selected"));
        currentOption.classList.add("selected");
    }

    dueDateInput.value = task.dueDate || "";
    startTimeInput.value = task.startTime || "";
    endTimeInput.value = task.endTime || "";

    sheetTitle.textContent = "تعديل المهمة";
    submitBtn.textContent = "تحديث";
    
    syncDisplays(); // Sync visually
    
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
    if (arrayOfTasks.filter(task => task.completed).length === 0) {
        showToast("لا توجد مهام مكتملة لمسحها", "info");
        return;
    }

    Swal.fire({
        title: 'هل أنت متأكد؟',
        text: "سيتم مسح جميع المهام المكتملة!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، امسحها!',
        cancelButtonText: 'إلغاء',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            arrayOfTasks = arrayOfTasks.filter(task => !task.completed);
            addDataToLocalStorage(arrayOfTasks);
            renderTasks();
            showToast("تم مسح المهام المكتملة", "success");
        }
    });
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
    Swal.fire({
        title: 'حذف المهمة؟',
        text: "لن تتمكن من استرجاع هذه المهمة!",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            arrayOfTasks = arrayOfTasks.filter((task) => task.id != taskId);
            addDataToLocalStorage(arrayOfTasks);
            renderTasks();
            showToast("تم حذف المهمة", "success");
        }
    });
}

function toggleStatusTaskWith(taskId) {
    for (let i = 0; i < arrayOfTasks.length; i++) {
        if (arrayOfTasks[i].id == taskId) {
            arrayOfTasks[i].completed = !arrayOfTasks[i].completed;
            
            if (arrayOfTasks[i].completed) {
                if (typeof successSound !== 'undefined') {
                    successSound.currentTime = 0;
                    successSound.play().catch(() => {});
                }

                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }

                const allDone = arrayOfTasks.length > 0 && arrayOfTasks.every(t => t.completed);
                if (allDone && typeof confetti !== 'undefined') {
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
let installBanner = document.querySelector("#pwa-install-banner");
let installBtn = document.querySelector("#pwa-install-btn");

// Handle early event capture
window.addEventListener('beforeinstallprompt', (e) => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) {
        installBanner.style.display = 'flex';
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            installBanner = document.querySelector("#pwa-install-banner");
            if (installBanner) installBanner.style.display = 'flex';
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    installBanner = document.querySelector("#pwa-install-banner");
    installBtn = document.querySelector("#pwa-install-btn");

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

    // iOS Detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isStandalone) {
        const info = document.querySelector(".pwa-info span");
        if (info && installBanner) {
            info.innerHTML = "ثبّت التطبيق: اضغط شارك <i class='fas fa-upload'></i> ثم 'إضافة للشاشة الرئيسية'";
            if (installBtn) installBtn.style.display = "none";
            installBanner.style.display = "flex";
        }
    }
});

window.addEventListener('appinstalled', () => {
    if (installBanner) installBanner.style.display = 'none';
});

// --- Better Input Interaction ---
window.addEventListener('DOMContentLoaded', () => {
    const inputsToTrigger = document.querySelectorAll('.form-date, .form-time, .input-with-icon');
    inputsToTrigger.forEach(container => {
        container.addEventListener('click', (e) => {
            const input = container.tagName === 'INPUT' ? container : container.querySelector('input');
            if (input && typeof input.showPicker === 'function') {
                try {
                    input.showPicker();
                } catch (err) {
                    console.error("Picker error:", err);
                }
            }
        });
    });
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.log('Service Worker failed', err));
    });
}

