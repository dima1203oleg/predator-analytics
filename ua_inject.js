(function() {
    const dict = {
        'Home': 'Головна',
        'Discover': 'Огляд даних',
        'Dashboard': 'Дашборд',
        'Dashboards': 'Дашборди',
        'Visualize': 'Аналітика',
        'Dev Tools': 'Інструменти',
        'Stack Management': 'Налаштування',
        'Management': 'Керування',
        'Search': 'Пошук',
        'Save': 'Зберегти',
        'Cancel': 'Відмінити',
        'Refresh': 'Оновити',
        'Welcome to OpenSearch Dashboards': 'Вітаємо у Predator Analytics'
    };
    function translate() {
        const walkers = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while(node = walkers.nextNode()) {
            const text = node.nodeValue.trim();
            if (dict[text]) {
                node.nodeValue = node.nodeValue.replace(text, dict[text]);
            }
        }
    }
    const observer = new MutationObserver(translate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    translate();
    console.log('Predator UA Active 🇺🇦');
})();
