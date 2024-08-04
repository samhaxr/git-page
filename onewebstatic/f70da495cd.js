(function () {
    function run() {
        var g = function (id) {
                return document.getElementById(id);
            }, container = g('MobileHeader_container'), burgerMenuIcon = g('MobileHeader_burgerMenuIcon'), inActivebgColor = burgerMenuIcon.getAttribute('data-inactive-bgcolor'), activebgColor = burgerMenuIcon.getAttribute('data-active-bgcolor'), menu = g('mm'), overlay = g('mm-overlay'), body = document.getElementsByTagName('body')[0], on = false, height;
        if (!container || !body) {
            return;
        }
        function setOnOffClass(ele, newCls) {
            ele.className = ele.className.replace(/\bon|off\b/, '').trim() + ' ' + newCls;
        }
        function setMenuIconStyles(color) {
            Array.prototype.slice.call(burgerMenuIcon.childNodes).forEach(function (node) {
                node.style.backgroundColor = color;
            });
        }
        function toggleClasses() {
            var className = on ? 'on' : 'off';
            setOnOffClass(burgerMenuIcon, className);
            setOnOffClass(menu, className);
            setOnOffClass(overlay, className);
            setMenuIconStyles(on ? activebgColor : inActivebgColor);
        }
        function toggleMenu() {
            on = !on;
            toggleClasses();
            if (on) {
                height = Math.max(window.innerHeight || document.documentElement.clientHeight, body.offsetHeight, menu.offsetHeight);
                menu.style.height = height + 'px';
                overlay.style.height = height - 49 + 'px';
            }
        }
        container.onclick = toggleMenu;
        overlay.onclick = toggleMenu;
        burgerMenuIcon.onclick = toggleMenu;
        menu.onclick = function (e) {
            var target, parent, targetTag;
            target = e ? e.target : window.event.srcElement;
            target = target.nodeType === 3 ? target.parentNode : target;
            targetTag = target.tagName;
            if ((targetTag === 'DIV' || targetTag === 'SPAN') && target.id !== 'mm') {
                parent = targetTag === 'SPAN' ? target.parentNode.parentNode.parentNode : target.parentNode.parentNode;
                parent.className = parent.className ? '' : 'expanded';
                return;
            }
            on = false;
            toggleClasses();
        };
    }
    var readyTimer = setInterval(function () {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            run();
            clearInterval(readyTimer);
        }
    }, 10);
}());
(function runCrmScript() {
}());