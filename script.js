document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const container = document.querySelector('.container'); // ★追加: ドラッグ時の座標計算に必要
    const gridContainer = document.querySelector('.grid-container');
    const newTaskNameInput = document.getElementById('newTaskName');
    const addTaskButton = document.getElementById('addTaskButton');

    const taskDetailModal = document.getElementById('taskDetailModal');
    const closeButton = taskDetailModal.querySelector('.close-button'); // 親要素から取得するよう修正
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

    // プロジェクト保存・ロード関連の要素
    const saveProjectButton = document.getElementById('saveProjectButton');
    const archiveList = document.getElementById('archiveList');
    const noArchiveMessage = document.getElementById('noArchiveMessage');

    // ★追加機能パネルの要素 (新規)
    const quickSaveButton = document.getElementById('quickSaveButton');
    const clearAllTasksButton = document.getElementById('clearAllTasksButton');


    // --- 状態変数 ---
    let activeItem = null; // 現在ドラッグ中のタスク要素
    let draggedTask = null; // ドラッグ中のタスク要素 (onMouseMove, onMouseUp用)
    let xOffset = 0; // ドラッグ開始時のXオフセット
    let yOffset = 0; // ドラッグ開始時のYオフセット
    let tasks = []; // 現在のグリッド上のタスクデータを保持する配列
    let editingTaskId = null; // 詳細モーダルで編集中のタスクID
    let draggedTaskName = null; // パレットからドラッグされたタスク名
    let draggedGeneratedImageSrc = null; // AI生成アイコンの画像URL

    let isDraggingOccurred = false; // ドラッグが発生したか（クリックと区別するため）
    let dragStartX = 0; // ドラッグ開始時のX座標
    let dragStartY = 0; // ドラッグ開始時のY座標
    let currentZIndex = 10; // アイコンの重なり順を管理

    // タスクIDのユニーク性を保つためのカウンター
    let taskIdCounter = 0;
    const savedTaskIdCounter = localStorage.getItem('taskIdCounter');
    if (savedTaskIdCounter) {
        taskIdCounter = parseInt(savedTaskIdCounter, 10);
    }
    const saveTaskIdCounter = () => {
        localStorage.setItem('taskIdCounter', taskIdCounter.toString());
    };

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
    // 現在のプロジェクトのタスクをlocalStorageに保存する関数
    function saveTasks() {
        localStorage.setItem('twoD_todo_tasks', JSON.stringify(tasks));
    }

    // グリッドにタスク要素を生成・追加する関数
    function createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task-icon');
        taskDiv.setAttribute('data-id', task.id);
        taskDiv.style.left = `${task.x}px`;
        taskDiv.style.top = `${task.y}px`;
        taskDiv.style.zIndex = currentZIndex++; // 重なり順を設定

        if (task.generatedImageSrc) {
            const imgElement = document.createElement('img');
            imgElement.src = task.generatedImageSrc;
            imgElement.alt = task.name;
            taskDiv.appendChild(imgElement);
        } else {
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

        // タスクアイコンのドラッグ開始イベント
        taskDiv.addEventListener('mousedown', (e) => {
            // モーダルが開いている場合はドラッグしない
            if (taskDetailModal.style.display === 'flex') {
                return;
            }
            draggedTask = taskDiv; // activeItemの代わりにdraggedTaskを使用
            draggedTask.classList.add('dragging');
            draggedTask.style.zIndex = currentZIndex++;

            const rect = draggedTask.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect(); // .containerの座標
            xOffset = e.clientX - rect.left;
            yOffset = e.clientY - rect.top;

            isDraggingOccurred = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // クリックで詳細を表示するイベント (ドラッグと区別)
        taskDiv.addEventListener('mouseup', (e) => {
            // 短いクリック（ドラッグではない）の場合にモーダルを表示
            const dragThreshold = 5; // 例えば5ピクセル以内ならクリックと判定
            if (Math.abs(e.clientX - dragStartX) < dragThreshold && Math.abs(e.clientY - dragStartY) < dragThreshold && !isDraggingOccurred) {
                showTaskDetail(task.id);
            }
            isDraggingOccurred = false; // リセット
        });

        gridContainer.appendChild(taskDiv);
    }

    // ドラッグ中のマウス移動処理
    const onMouseMove = (e) => {
        if (!draggedTask) return;
        e.preventDefault();

        const containerRect = container.getBoundingClientRect();
        const draggedRect = draggedTask.getBoundingClientRect();

        let newLeft = e.clientX - containerRect.left - xOffset;
        let newTop = e.clientY - containerRect.top - yOffset;

        // コンテナの境界内に制限
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - draggedRect.width));
        newTop = Math.max(0, Math.min(newTop, containerRect.height - draggedRect.height));

        draggedTask.style.left = `${newLeft}px`;
        draggedTask.style.top = `${newTop}px`;

        const dragThreshold = 5;
        if (Math.abs(e.clientX - dragStartX) > dragThreshold || Math.abs(e.clientY - dragStartY) > dragThreshold) {
            isDraggingOccurred = true;
        }
    };

    // ドラッグ終了時の処理
    const onMouseUp = () => {
        if (draggedTask) {
            draggedTask.classList.remove('dragging');

            const taskId = draggedTask.getAttribute('data-id');
            const taskIndex = tasks.findIndex(task => task.id === taskId);

            if (taskIndex !== -1) {
                tasks[taskIndex].x = draggedTask.offsetLeft;
                tasks[taskIndex].y = draggedTask.offsetTop;
                saveTasks();
            }
            draggedTask = null; // draggedTaskをnullにリセット
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };


    // --- 新しいタスクの追加 (テキスト入力用) ---
    function addNewTask() {
        const taskName = newTaskNameInput.value.trim();
        if (taskName === "") {
            alert("タスク名を入力してください！");
            return;
        }

        const newId = `task-${taskIdCounter++}`; // ユニークIDを生成
        const newTask = {
            id: newId,
            name: taskName,
            x: 50,
            y: 50,
            generatedImageSrc: null // 通常タスクなのでnull
        };

        tasks.push(newTask);
        createTaskElement(newTask);
        saveTasks();
        saveTaskIdCounter(); // IDカウンターを保存
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
                // nameSpan以外の要素（iタグやimgタグ）を削除
                const oldIconOrImage = taskElement.querySelector('i, img');
                if (oldIconOrImage) {
                    taskElement.removeChild(oldIconOrImage);
                }

                // AI生成画像がある場合は画像を、そうでない場合はFont Awesomeアイコンを再生成
                if (task.generatedImageSrc) {
                    const imgElement = document.createElement('img');
                    imgElement.src = task.generatedImageSrc;
                    imgElement.alt = newName;
                    taskElement.prepend(imgElement); // 先頭に追加
                } else {
                    const iconElement = document.createElement('i');
                    const iconClasses = getTaskIconClass(newName).split(' ');
                    iconClasses.forEach(className => {
                        if (className) {
                            iconElement.classList.add(className);
                        }
                    });
                    taskElement.prepend(iconElement); // 先頭に追加
                }

                // nameSpanのテキストを更新
                const nameSpan = taskElement.querySelector('span');
                if (nameSpan) {
                    nameSpan.textContent = newName;
                }
            }
            saveTasks();
            hideTaskDetail();
        }
    }
    
    // --- タスクの削除 ---
function deleteTask() {
    // The confirmation dialog has been removed.
    tasks = tasks.filter(t => t.id !== editingTaskId);
    const taskElement = document.querySelector(`.task-icon[data-id="${editingTaskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }
    saveTasks();
    hideTaskDetail();
}
    // --- 新しいアイコンのドラッグ＆ドロップ処理 (アイコンパレット用) ---
    draggableIcons.forEach(icon => {
        icon.setAttribute('draggable', 'true');

        icon.addEventListener('dragstart', (e) => {
            if (taskDetailModal.style.display === 'flex') {
                e.preventDefault();
                return;
            }
            draggedTaskName = icon.getAttribute('data-task-name');
            draggedGeneratedImageSrc = null; // 通常アイコンなのでnull
            e.dataTransfer.setData('text/plain', draggedTaskName);
            e.dataTransfer.effectAllowed = "copy";
            e.currentTarget.classList.add('is-dragging');
        });

        icon.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('is-dragging');
            draggedTaskName = null;
        });
    });

    // --- AI生成アイコンのドラッグ＆ドロップ処理 ---
    if (addGeneratedIconButton) {
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
                e.dataTransfer.setData('image/x-generated-icon', draggedGeneratedImageSrc); // カスタムMIMEタイプ
            }
            e.dataTransfer.effectAllowed = "copy";
            e.currentTarget.classList.add('is-dragging');
        });

        addGeneratedIconButton.addEventListener('dragend', (e) => {
            e.currentTarget.classList.remove('is-dragging');
            draggedTaskName = null;
            draggedGeneratedImageSrc = null;
        });
    }

    // --- grid-containerへのドロップ処理 ---
    gridContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    gridContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation(); // 親要素へのイベント伝播を停止

        // draggedTaskName が存在するか、または draggedGeneratedImageSrc が存在するか
        if (draggedTaskName || draggedGeneratedImageSrc) {
            const newTaskId = `task-${taskIdCounter++}`; // ユニークIDを生成

            const gridRect = gridContainer.getBoundingClientRect();
            const dropX = e.clientX - gridRect.left;
            const dropY = e.clientY - gridRect.top;

            const iconWidth = 90;
            const iconHeight = 90;
            let newX = dropX - (iconWidth / 2);
            let newY = dropY - (iconHeight / 2);

            // グリッドコンテナの範囲内に収まるように調整
            const boundedX = Math.max(0, Math.min(newX, gridRect.width - iconWidth));
            const boundedY = Math.max(0, Math.min(newY, gridRect.height - iconHeight));

            const newTask = {
                id: newTaskId,
                name: draggedTaskName,
                x: boundedX,
                y: boundedY,
                generatedImageSrc: draggedGeneratedImageSrc
            };

            tasks.push(newTask);
            createTaskElement(newTask);
            saveTasks();
            saveTaskIdCounter(); // IDカウンターを保存

            // AI生成アイコンからのドロップの場合、プレビューをリセット
            if (addGeneratedIconButton && addGeneratedIconButton.style.display !== 'none') {
                generatedIconPreview.innerHTML = `
                    <i class="fa-solid fa-robot fa-4x" style="color: #666;"></i>
                    <p>ここに生成されたアイコンが表示されます</p>
                `;
                addGeneratedIconButton.style.display = 'none';
                if (aiPromptInput) aiPromptInput.value = '';
            }

            // ドロップ後の状態変数リセット
            draggedTaskName = null;
            draggedGeneratedImageSrc = null;

        } else {
            console.warn('ドラッグされたアイテムが不明です。ドロップがキャンセルされました。');
        }
    });

    // --- AI画像生成機能関連 ---
    if (generateIconButton) {
        generateIconButton.addEventListener('click', () => {
            const prompt = aiPromptInput.value.trim();
            if (prompt === "") {
                alert("生成したいアイコンのキーワードを入力してください！");
                return;
            }

            // AI生成中はボタンとプレビューを更新
            generatedIconPreview.innerHTML = '<i class="fa-solid fa-hourglass-half fa-spin fa-4x" style="color: #6c5ce7;"></i><p>生成中...</p>';
            if (addGeneratedIconButton) addGeneratedIconButton.style.display = 'none';
            generateIconButton.disabled = true; // 生成中はボタンを無効化
            aiPromptInput.disabled = true;

            // ダミーの画像生成（実際のAPI呼び出しの代わりにプレースホルダー画像）
            // 実際にはここでサーバーへのAPIリクエストなどを行う
            setTimeout(() => {
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
                generateIconButton.disabled = false; // ボタンを再度有効化
                aiPromptInput.disabled = false;
            }, 1500); // 1.5秒後に生成完了のシミュレーション
        });
    }

    // AI生成アイコンを「生成アイコンを追加」ボタンからクリックで追加する機能（ドラッグ＆ドロップでも追加できるため、これは補助的な機能）
    if (addGeneratedIconButton) {
        addGeneratedIconButton.addEventListener('click', () => {
            const taskName = addGeneratedIconButton.getAttribute('data-generated-task-name');
            const imageUrl = addGeneratedIconButton.getAttribute('data-generated-image-src');

            if (taskName && imageUrl) {
                const newId = `task-${taskIdCounter++}`;
                const newTask = {
                    id: newId,
                    name: taskName,
                    x: 50, // デフォルト位置
                    y: 50, // デフォルト位置
                    generatedImageSrc: imageUrl
                };
                tasks.push(newTask);
                createTaskElement(newTask);
                saveTasks();
                saveTaskIdCounter();

                // プレビューをリセット
                generatedIconPreview.innerHTML = `
                    <i class="fa-solid fa-robot fa-4x" style="color: #666;"></i>
                    <p>ここに生成されたアイコンが表示されます</p>
                `;
                addGeneratedIconButton.style.display = 'none';
                aiPromptInput.value = '';
            }
        });
    }

    // --- プロジェクト保存・ロード・アーカイブ機能 ---

    // 現在のプロジェクトの状態を取得する
    const getCurrentProjectState = () => {
        const currentTasks = [];
        document.querySelectorAll('.task-icon').forEach(taskIcon => {
            currentTasks.push({
                id: taskIcon.dataset.id,
                name: taskIcon.querySelector('span').textContent,
                iconHtml: taskIcon.querySelector('i') ? taskIcon.querySelector('i').className : null,
                generatedImageSrc: taskIcon.querySelector('img') ? taskIcon.querySelector('img').src : null,
                x: taskIcon.offsetLeft,
                y: taskIcon.offsetTop
            });
        });
        return {
            tasks: currentTasks,
            lastTaskId: taskIdCounter
        };
    };

    // プロジェクトの状態をLocalStorageに保存する
    saveProjectButton.addEventListener('click', () => {
        const projectName = prompt('プロジェクト名を入力してください:');
        if (projectName) {
            const projectState = getCurrentProjectState();
            const timestamp = new Date().toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const projectData = {
                name: projectName,
                timestamp: timestamp,
                state: projectState
            };
            let projects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
            projects.push(projectData);
            localStorage.setItem('savedProjects', JSON.stringify(projects));
            alert(`「${projectName}」が保存されました！`);
            renderArchiveList(); // アーカイブリストを更新
        }
    });

    // プロジェクトの状態をグリッドにロードする
    const loadProject = (projectState) => {
        gridContainer.innerHTML = '';
        tasks = [];
        currentZIndex = 10;

        projectState.tasks.forEach(task => {
            const newTask = {
                id: task.id,
                name: task.name,
                x: task.x,
                y: task.y,
                generatedImageSrc: task.generatedImageSrc
            };
            tasks.push(newTask);
            createTaskElement(newTask);
        });

        if (projectState.lastTaskId !== undefined) {
            taskIdCounter = projectState.lastTaskId;
            saveTaskIdCounter();
        }
        alert('プロジェクトがロードされました！');
        saveTasks(); // ロードしたタスクを現在のタスクとして保存
    };

    // アーカイブリストをレンダリングする
    const renderArchiveList = () => {
        archiveList.innerHTML = '';
        let projects = JSON.parse(localStorage.getItem('savedProjects') || '[]');

        if (projects.length === 0) {
            noArchiveMessage.style.display = 'block';
            return;
        } else {
            noArchiveMessage.style.display = 'none';
        }

        projects.forEach((project, index) => {
            const archiveItem = document.createElement('div');
            archiveItem.classList.add('archive-item');
            archiveItem.innerHTML = `
                <h3>${project.name}</h3>
                <p>保存日時: ${project.timestamp}</p>
                <div class="actions">
                    <button class="load-button" data-index="${index}">ロード</button>
                    <button class="delete-archive-button" data-index="${index}">削除</button>
                </div>
            `;
            archiveList.appendChild(archiveItem);
        });

        archiveList.querySelectorAll('.load-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                const projectsToLoad = JSON.parse(localStorage.getItem('savedProjects') || '[]');
                if (projectsToLoad[index]) {
                    if (confirm('現在のプロジェクトは保存されていません。ロードすると上書きされますがよろしいですか？')) {
                        loadProject(projectsToLoad[index].state);
                    }
                }
            });
        });

        archiveList.querySelectorAll('.delete-archive-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (confirm('このプロジェクトをアーカイブから削除しますか？')) {
                    let projectsToDelete = JSON.parse(localStorage.getItem('savedProjects') || '[]');
                    projectsToDelete.splice(index, 1);
                    localStorage.setItem('savedProjects', JSON.stringify(projectsToDelete));
                    renderArchiveList();
                }
            });
        });
    };

    // --- 新しい追加機能のイベントリスナー (新規) ---
    if (quickSaveButton) {
        quickSaveButton.addEventListener('click', () => {
            const projectName = `クイック保存 ${new Date().toLocaleString('ja-JP', {
                year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}`;
            const projectState = getCurrentProjectState();
            const projectData = {
                name: projectName,
                timestamp: new Date().toLocaleString('ja-JP', {
                    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }),
                state: projectState
            };
            let projects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
            projects.push(projectData);
            localStorage.setItem('savedProjects', JSON.stringify(projects));
            alert('現在の状態がクイック保存されました！');
            renderArchiveList();
        });
    }

    if (clearAllTasksButton) {
        clearAllTasksButton.addEventListener('click', () => {
            if (confirm('グリッド上のすべてのタスクを削除しますか？この操作は元に戻せません。')) {
                gridContainer.innerHTML = ''; // DOMからすべてのタスクを削除
                tasks = []; // tasks配列をクリア
                saveTasks(); // LocalStorageを更新
                alert('すべてのタスクが削除されました。');
            }
        });
    }


    // --- イベントリスナーの追加 ---
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

    // ページの読み込み時にタスクをロード & アーカイブリストを初期表示
    const initialTasks = localStorage.getItem('twoD_todo_tasks');
    if (initialTasks) {
        tasks = JSON.parse(initialTasks);
        tasks.forEach(task => createTaskElement(task));
    } else {
        // デフォルトのタスクを生成（初回アクセス時のみ）
        tasks = [
            { id: `task-${taskIdCounter++}`, name: 'メール', x: 200, y: 150, generatedImageSrc: null },
            { id: `task-${taskIdCounter++}`, name: '友達', x: 200, y: 400, generatedImageSrc: null },
            { id: `task-${taskIdCounter++}`, name: '本', x: 600, y: 400, generatedImageSrc: null },
            { id: `task-${taskIdCounter++}`, name: '音楽', x: 600, y: 150, generatedImageSrc: null }
        ];
        saveTasks();
        saveTaskIdCounter();
        tasks.forEach(task => createTaskElement(task));
    }

    renderArchiveList(); // アプリケーション起動時にアーカイブリストを初期表示
});
