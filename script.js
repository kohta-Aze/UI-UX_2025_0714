// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const gridContainer = document.querySelector('.grid-container');
    const newTaskNameInput = document.getElementById('newTaskName');
    const addTaskButton = document.getElementById('addTaskButton');

    const taskDetailModal = document.getElementById('taskDetailModal');
    const closeButton = document.querySelector('.close-button');
    const detailTaskNameInput = document.getElementById('detailTaskName');
    const saveTaskButton = document.getElementById('saveTaskButton');
    const deleteTaskButton = document.getElementById('deleteTaskButton');
    const cancelTaskButton = document.getElementById('cancelTaskButton');

    // アイコンパレットのアイコン
    const draggableIcons = document.querySelectorAll('.draggable-icon');

    // AI画像生成機能の要素
    const aiPromptInput = document.getElementById('aiPromptInput');
    const generateIconButton = document.getElementById('generateIconButton');
    const generatedIconPreview = document.getElementById('generatedIconPreview');
    const addGeneratedIconButton = document.getElementById('addGeneratedIconButton'); // AI生成アイコン追加ボタン

    // script.js (DOMContentLoadedイベントリスナーの中)
// ... 既存のコード ...

// --- 状態変数 ---
let activeItem = null;
let xOffset = 0;
let yOffset = 0;
let tasks = [];
let editingTaskId = null;
let draggedTaskName = null;
let draggedGeneratedImageSrc = null;
let isDraggingOccurred = false; // ★追加：ドラッグが発生したか
let dragStartX = 0; // ★追加：ドラッグ開始時のX座標
let dragStartY = 0; // ★追加：ドラッグ開始時のY座標

// ... 既存のコード ...

    // --- ヘルパー関数: タスク名からアイコンクラスを決定 ---
    function getTaskIconClass(taskName) {
        if (taskName.includes('メール')) return 'fa-solid fa-envelope';
        if (taskName.includes('友達') || taskName.includes('友人')) return 'fa-solid fa-face-smile';
        if (taskName.includes('本') || taskName.includes('読書')) return 'fa-solid fa-book';
        if (taskName.includes('音楽') || taskName.includes('歌')) return 'fa-solid fa-music';
        if (taskName.includes('インターン') || taskName.includes('仕事')) return 'fa-solid fa-briefcase';
        if (taskName.includes('ポートフォリオ') || taskName.includes('制作')) return 'fa-solid fa-folder-open';
        if (taskName.includes('Web') || taskName.includes('学習') || taskName.includes('コード')) return 'fa-solid fa-code';
        if (taskName.includes('学校') || taskName.includes('勉強')) return 'fa-solid fa-school';
        if (taskName.includes('スポーツ') || taskName.includes('運動')) return 'fa-solid fa-person-running';
        if (taskName.includes('設定')) return 'fa-solid fa-gear';
        if (taskName.includes('Twitter') || taskName.includes('ツイッター')) return 'fa-brands fa-twitter';
        if (taskName.includes('ラジオ')) return 'fa-solid fa-radio';
        if (taskName.includes('デバイス')) return 'fa-solid fa-laptop';
        if (taskName.includes('連絡')) return 'fa-solid fa-hashtag';
        return 'fa-solid fa-circle';
    }

    // --- データ保存・読み込み関連 ---
    function loadTasks() {
        const storedTasks = localStorage.getItem('twoD_todo_tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
            tasks.forEach(task => createTaskElement(task));
        } else {
            // デフォルトのタスクを画像に合わせて調整
            tasks = [
                { id: 'task-mail', name: 'メール', x: 200, y: 150 },
                { id: 'task-friend', name: '友達', x: 200, y: 400 },
                { id: 'task-book', name: '本', x: 600, y: 400 },
                { id: 'task-music', name: '音楽', x: 600, y: 150 }
            ];
            saveTasks();
            tasks.forEach(task => createTaskElement(task));
        }
    }

    function saveTasks() {
        localStorage.setItem('twoD_todo_tasks', JSON.stringify(tasks));
    }

    // --- タスクアイコンのDOM操作関連 ---
    // script.js
// ... 既存のコード ...

    // script.js
// ... (中略) ...

function createTaskElement(task) {
    console.log('createTaskElement called for task:', task.id, task.name); // ★追加

    const taskDiv = document.createElement('div');
    taskDiv.classList.add('task-icon');
    taskDiv.setAttribute('data-id', task.id);
    taskDiv.style.left = `${task.x}px`;
    taskDiv.style.top = `${task.y}px`;

    // 以前の指示でコメントアウトまたは削除をお願いした is-dragging クラスの追加行が
    // もし残っていたら、必ず削除してください。
    // taskDiv.classList.add('is-dragging'); // この行は新しいタスク作成時には不要です！

    if (task.generatedImageSrc) {
        console.log('Adding generated image:', task.generatedImageSrc); // ★追加
        const imgElement = document.createElement('img');
        imgElement.src = task.generatedImageSrc;
        imgElement.alt = task.name;
        taskDiv.appendChild(imgElement);
    } else {
        console.log('Adding Font Awesome icon for:', task.name); // ★追加
        const iconElement = document.createElement('i');
        const iconClasses = getTaskIconClass(task.name).split(' ');
        iconClasses.forEach(className => {
            if (className) {
                iconElement.classList.add(className);
            }
        });
        taskDiv.appendChild(iconElement);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = task.name;
    taskDiv.appendChild(nameSpan);

    console.log('Task element created:', taskDiv); // ★追加

    // クリックで詳細を表示するイベント
    taskDiv.addEventListener('click', (e) => {
        if (!isDraggingOccurred) {
            showTaskDetail(task.id);
        }
        isDraggingOccurred = false;
    });

    try {
        gridContainer.appendChild(taskDiv);
        console.log('Task element appended to gridContainer.'); // ★追加
    } catch (error) {
        console.error('Error appending taskDiv to gridContainer:', error); // ★追加
    }
}

// ... (中略) ...
// ... 既存のコード ...

    // --- 新しいタスクの追加 (テキスト入力用) ---
    function addNewTask() {
        const taskName = newTaskNameInput.value.trim();
        if (taskName === "") {
            alert("タスク名を入力してください！");
            return;
        }

        const newId = `task-${Date.now()}`;
        const newTask = {
            id: newId,
            name: taskName,
            x: 50,
            y: 50
        };

        tasks.push(newTask);
        createTaskElement(newTask);
        saveTasks();
        newTaskNameInput.value = '';
    }

    // --- タスク詳細モーダルの表示・非表示 ---
    function showTaskDetail(id) {
        editingTaskId = id;
        const task = tasks.find(t => t.id === id);
        if (task) {
            detailTaskNameInput.value = task.name;
            taskDetailModal.style.display = 'flex';
        }
    }

    function hideTaskDetail() {
        taskDetailModal.style.display = 'none';
        editingTaskId = null;
    }

    // --- タスクの保存（編集） ---
    function saveEditedTask() {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            const newName = detailTaskNameInput.value.trim();
            if (newName === "") {
                alert("タスク名を入力してください！");
                return;
            }
            task.name = newName;

            const taskElement = document.querySelector(`.task-icon[data-id="${editingTaskId}"]`);
            if (taskElement) {
                // 既存のアイコンや画像を削除
                while (taskElement.firstChild) {
                    taskElement.removeChild(taskElement.firstChild);
                }

                // AI生成画像がある場合は画像を、そうでない場合はFont Awesomeアイコンを再生成
                if (task.generatedImageSrc) {
                    const imgElement = document.createElement('img');
                    imgElement.src = task.generatedImageSrc;
                    imgElement.alt = newName;
                    taskElement.appendChild(imgElement);
                } else {
                    const iconElement = document.createElement('i');
                    const iconClasses = getTaskIconClass(newName).split(' ');
                    iconClasses.forEach(className => {
                        if (className) {
                            iconElement.classList.add(className);
                        }
                    });
                    taskElement.appendChild(iconElement);
                }

                const nameSpan = document.createElement('span');
                nameSpan.textContent = newName;
                taskElement.appendChild(nameSpan);
            }
            saveTasks();
            hideTaskDetail();
        }
    }

    // --- タスクの削除 ---
   function deleteTask() {
    // 確認メッセージなしで即時削除
    tasks = tasks.filter(t => t.id !== editingTaskId);
    const taskElement = document.querySelector(`.task-icon[data-id="${editingTaskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }
    saveTasks();
    hideTaskDetail();
}

    // --- ドラッグ＆ドロップ関連の関数 (既存タスクの移動用) ---
    gridContainer.addEventListener('mouseup', dragEnd);
    gridContainer.addEventListener('touchend', dragEnd);
    gridContainer.addEventListener('mousemove', drag);
    gridContainer.addEventListener('touchmove', drag);
    gridContainer.addEventListener('mousedown', dragStart);
    gridContainer.addEventListener('touchstart', dragStart, { passive: false });

    // script.js

function dragStart(e) {
    if (taskDetailModal.style.display === 'flex') {
        activeItem = null;
        return;
    }

    let targetElement = e.target;
    while (targetElement && !targetElement.classList.contains("task-icon") && targetElement !== gridContainer) {
        targetElement = targetElement.parentElement;
    }

    if (targetElement && targetElement.classList.contains("task-icon")) {
        activeItem = targetElement;
        activeItem.classList.add('dragging');

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        const itemLeft = activeItem.offsetLeft;
        const itemTop = activeItem.offsetTop;

        xOffset = clientX - (gridContainer.getBoundingClientRect().left + itemLeft);
        yOffset = clientY - (gridContainer.getBoundingClientRect().top + itemTop);

        isDraggingOccurred = false;
        dragStartX = clientX;
        dragStartY = clientY;

        // ★★★ この行を削除してください ★★★
        // e.dataTransfer.effectAllowed = "move"; 
    }
}
   // script.js
// ... 既存のコード ...

function dragEnd(e) {
    if (activeItem) {
        activeItem.classList.remove('dragging');
        // activeItem.classList.add('dragging-just-finished'); // ★ここを削除またはコメントアウト
        // setTimeout(() => { // ★ここを削除またはコメントアウト
        //     if (activeItem) { // ★ここを削除またはコメントアウト
        //         activeItem.classList.remove('dragging-just-finished'); // ★ここを削除またはコメントアウト
        //     } // ★ここを削除またはコメントアウト
        // }, 100); // ★ここを削除またはコメントアウト

        const taskId = activeItem.getAttribute('data-id');
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex !== -1) {
            tasks[taskIndex].x = activeItem.offsetLeft;
            tasks[taskIndex].y = activeItem.offsetTop;
            saveTasks();
        }
        activeItem = null; // ★activeItemをnullにリセット
        xOffset = 0;
        yOffset = 0;
        // isDraggingOccurred は次の dragStart でリセットされる
    }
}

// ... 既存のコード ...
    // script.js
// ... 既存のコード ...

function drag(e) {
    if (activeItem) {
        e.preventDefault();

        const containerRect = gridContainer.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        let newLeft = clientX - containerRect.left - xOffset;
        let newTop = clientY - containerRect.top - yOffset;

        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - itemRect.width));
        newTop = Math.max(0, Math.min(newTop, containerRect.height - itemRect.height));

        activeItem.style.left = `${newLeft}px`;
        activeItem.style.top = `${newTop}px`;

        // ★追加：ドラッグがあったと判定するしきい値
        const dragThreshold = 5; // 例えば5ピクセル以上移動したらドラッグと判定
        if (Math.abs(clientX - dragStartX) > dragThreshold || Math.abs(clientY - dragStartY) > dragThreshold) {
            isDraggingOccurred = true;
        }
    }
}

// ... 既存のコード ...
    // --- 新しいアイコンのドラッグ＆ドロップ処理 (アイコンパレット用) ---
    // ... 既存のコード ...

// --- 新しいアイコンのドラッグ＆ドロップ処理 (アイコンパレット用) ---
draggableIcons.forEach(icon => {
    icon.setAttribute('draggable', 'true');

    icon.addEventListener('dragstart', (e) => {
        if (taskDetailModal.style.display === 'flex') {
            e.preventDefault();
            return;
        }
        draggedTaskName = icon.getAttribute('data-task-name');
        draggedGeneratedImageSrc = null;
        e.dataTransfer.setData('text/plain', draggedTaskName);
        // ★★★ この行を追加/修正 ★★★
        e.dataTransfer.effectAllowed = "copy"; // パレットからのドラッグはコピーなので "copy"
        e.currentTarget.classList.add('is-dragging');
    });

    icon.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('is-dragging');
        draggedTaskName = null;
    });
});

// ... 既存のコード ...

    if (addGeneratedIconButton) { // 要素が存在するか確認
        addGeneratedIconButton.setAttribute('draggable', 'true');
        addGeneratedIconButton.addEventListener('dragstart', (e) => {
            if (taskDetailModal.style.display === 'flex') {
                e.preventDefault();
                return;
            }
            draggedTaskName = e.currentTarget.getAttribute('data-generated-task-name');
            // AI生成画像URLもデータ転送に含める
            const imgElement = generatedIconPreview.querySelector('img');
            draggedGeneratedImageSrc = imgElement ? imgElement.src : null;

            e.dataTransfer.setData('text/plain', draggedTaskName);
            // 生成画像URLも別の形式で転送（必要に応じて）
            if (draggedGeneratedImageSrc) {
                e.dataTransfer.setData('image/x-generated-icon', draggedGeneratedImageSrc);
            }
            e.currentTarget.classList.add('is-dragging');
        });

        addGeneratedIconButton.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('is-dragging');
            draggedTaskName = null;
            draggedGeneratedImageSrc = null; // リセット
        });
    }


    // ... 既存のコード ...

// --- grid-containerへのドロップ処理 ---
gridContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    // ★★★ この行を修正 ★★★
    e.dataTransfer.dropEffect = 'copy'; // パレットやAI生成アイコンからのドロップはコピー
});


gridContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    console.log('Drop event fired.');
    console.log('draggedTaskName:', draggedTaskName);
    console.log('draggedGeneratedImageSrc:', draggedGeneratedImageSrc);

    if (draggedTaskName) {
        const newTaskId = `task-${Date.now()}`;

        const gridRect = gridContainer.getBoundingClientRect();
        const dropX = e.clientX - gridRect.left;
        const dropY = e.clientY - gridRect.top;

        const iconWidth = 90;
        const iconHeight = 90;
        let newX = dropX - (iconWidth / 2);
        let newY = dropY - (iconHeight / 2);

        // ★★★ ここにログを追加 ★★★
        console.log(`Calculated initial newX: ${newX}, newY: ${newY}`);

        // グリッドコンテナの範囲内に収まるように調整
        const boundedX = Math.max(0, Math.min(newX, gridRect.width - iconWidth));
        const boundedY = Math.max(0, Math.min(newY, gridRect.height - iconHeight));

        // ★★★ ここにもログを追加 ★★★
        console.log(`Bounded X: ${boundedX}, Bounded Y: ${boundedY}`);


        const newTask = {
            id: newTaskId,
            name: draggedTaskName,
            x: boundedX, // 調整後の座標を使用
            y: boundedY, // 調整後の座標を使用
            generatedImageSrc: draggedGeneratedImageSrc
        };

        tasks.push(newTask);
        createTaskElement(newTask);
        saveTasks();

        // ★★★ 新しく追加された要素が実際にDOMにあるか確認するログ ★★★
        const addedElement = document.querySelector(`.task-icon[data-id="${newTaskId}"]`);
        if (addedElement) {
            console.log('Task element successfully added to DOM at:', addedElement.style.left, addedElement.style.top);
        } else {
            console.error('Failed to add task element to DOM.');
        }


        draggedTaskName = null;
        draggedGeneratedImageSrc = null;

        if (addGeneratedIconButton && addGeneratedIconButton.style.display !== 'none') {
             generatedIconPreview.innerHTML = `
                <i class="fa-solid fa-robot fa-4x" style="color: #666;"></i>
                <p>ここに生成されたアイコンが表示されます</p>
            `;
            addGeneratedIconButton.style.display = 'none';
            if (aiPromptInput) aiPromptInput.value = '';
        }
    } else {
        console.warn('draggedTaskName is null. Drop cancelled.');
    }
});

// ... 既存のコード ...
// ... 既存のコード ...

    // --- AI画像生成機能関連 ---
    if (generateIconButton) { // 要素が存在するか確認
        generateIconButton.addEventListener('click', () => {
            const prompt = aiPromptInput.value.trim();
            if (prompt === "") {
                alert("生成したいアイコンのキーワードを入力してください！");
                return;
            }

            console.log(`AIにアイコン「${prompt}」の生成をリクエスト中...`);

            // ダミーの画像生成（実際のAPI呼び出しの代わりにプレースホルダー画像）
            const dummyImageUrl = `https://via.placeholder.com/100/A8C6FA/000000?text=${encodeURIComponent(prompt)}`;

            generatedIconPreview.innerHTML = `
                <img src="${dummyImageUrl}" alt="Generated Icon" style="max-width:90%; max-height:90%; object-fit:contain;">
                <p style="font-size:0.7em; margin-top:5px; color:#555;">"${prompt}"のアイコン</p>
            `;
            if (addGeneratedIconButton) {
                addGeneratedIconButton.style.display = 'block';
                addGeneratedIconButton.setAttribute('data-generated-task-name', prompt);
                addGeneratedIconButton.setAttribute('data-generated-image-src', dummyImageUrl); // 画像URLも設定
            }
        });
    }

    // AI生成アイコンを「生成アイコンを追加」ボタンからクリックで追加する機能（ドラッグ＆ドロップでも追加できるため、これは補助的な機能）
    // ... 既存のコード ...

    if (addGeneratedIconButton) { // 要素が存在するか確認
        addGeneratedIconButton.setAttribute('draggable', 'true');
        addGeneratedIconButton.addEventListener('dragstart', (e) => {
            if (taskDetailModal.style.display === 'flex') {
                e.preventDefault();
                return;
            }
            draggedTaskName = e.currentTarget.getAttribute('data-generated-task-name');
            const imgElement = generatedIconPreview.querySelector('img');
            draggedGeneratedImageSrc = imgElement ? imgElement.src : null;

            e.dataTransfer.setData('text/plain', draggedTaskName);
            if (draggedGeneratedImageSrc) {
                e.dataTransfer.setData('image/x-generated-icon', draggedGeneratedImageSrc);
            }
            // ★★★ この行を追加/修正 ★★★
            e.dataTransfer.effectAllowed = "copy"; // AI生成アイコンもコピーなので "copy"
            e.currentTarget.classList.add('is-dragging');
        });

        addGeneratedIconButton.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('is-dragging');
            draggedTaskName = null;
            draggedGeneratedImageSrc = null; // リセット
        });
    }

// ... 既存のコード ...

    // --- イベントリスナーの追加 (既存のもの) ---
    addTaskButton.addEventListener('click', addNewTask);
    newTaskNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });

    if (closeButton) closeButton.addEventListener('click', hideTaskDetail);
    if (cancelTaskButton) cancelTaskButton.addEventListener('click', hideTaskDetail);
    if (saveTaskButton) saveTaskButton.addEventListener('click', saveEditedTask);
    if (deleteTaskButton) deleteTaskButton.addEventListener('click', deleteTask);

    if (taskDetailModal) {
        taskDetailModal.addEventListener('click', (e) => {
            if (e.target === taskDetailModal) {
                hideTaskDetail();
            }
        });
    }

    // ページの読み込み時にタスクをロード
    loadTasks();
});
