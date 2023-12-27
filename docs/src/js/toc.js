var defaultOptions = {
    headings: 'h1, h2, h3, h4',
    scope: '.markdown-section',

    // To make work
    // title: 'Table of Contents',
    title: '',
    listType: 'ul',
}

// Element builders
var tocHeading = function (Title) {
    return document.createElement('h1').appendChild(
        document.createTextNode(Title)
    )
}

var aTag = function (src) {
    var a = document.createElement('a');
    var content = src.firstChild.innerHTML;

    // Use this to clip text w/ HTML in it.
    // https://github.com/arendjr/text-clipper
    a.innerHTML = content;
    a.href = src.firstChild.href;
    a.onclick = tocClick

    // In order to remove this gotta fix the styles.
    a.setAttribute('class', 'anchor');

    return a
};

var tocClick = function (e) {
    e.preventDefault();

    // 移除所有元素的“active”类
    var tocLinks = document.querySelectorAll('.page_toc a');
    tocLinks.forEach(function (link) {
        link.parentElement.classList.remove('active');
    });


    // 为被点击的元素添加“active”类
    // e.target.closest('a').parentElement.classList.add('active');
    // 为被点击的元素添加“active”类
    var clickedLink = e.target.closest('a');
    clickedLink.parentElement.classList.add('active');

    // 获取目标元素的 ID
    var targetId = getIdFromUrlForScroll(clickedLink.getAttribute('href'));
    var targetElement = document.getElementById(targetId);

    if (targetElement) {
        // 滚动到目标元素
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    // var divs = document.querySelectorAll('.page_toc .active');

    // // Remove the previous classes
    // [].forEach.call(divs, function (div) {
    //     div.setAttribute('class', 'anchor')
    // });

    // // Make sure this is attached to the parent not itself
    // e.target.parentNode.setAttribute('class', 'active')
};

var createList = function (wrapper, count) {
    while (count--) {
        wrapper = wrapper.appendChild(
            document.createElement('ul')
        );

        if (count) {
            wrapper = wrapper.appendChild(
                document.createElement('li')
            );
        }
    }

    return wrapper;
};

//------------------------------------------------------------------------

var getHeaders = function (selector) {
    var headings2 = document.querySelectorAll(selector);
    var ret = [];

    [].forEach.call(headings2, function (heading) {
        ret = ret.concat(heading);
    });

    return ret;
};

var getLevel = function (header) {
    var decs = header.match(/\d/g);

    return decs ? Math.min.apply(null, decs) : 1;
};

var jumpBack = function (currentWrapper, offset) {
    while (offset--) {
        currentWrapper = currentWrapper.parentElement;
    }

    return currentWrapper;
};

var buildTOC = function (options) {
    var ret = document.createElement('ul');
    var wrapper = ret;
    var lastLi = null;
    var selector = options.scope + ' ' + options.headings
    var headers = getHeaders(selector)

    headers.reduce(function (prev, curr, index) {
        var currentLevel = getLevel(curr.tagName);
        var offset = currentLevel - prev;

        wrapper = (offset > 0)
            ? createList(lastLi, offset)
            : jumpBack(wrapper, -offset * 2)

        wrapper = wrapper || ret;

        var li = document.createElement('li');

        wrapper.appendChild(li).appendChild(aTag(curr));

        lastLi = li;

        return currentLevel;
    }, getLevel(options.headings));

    return ret;
};

// Docsify plugin functions
function plugin(hook, vm) {
    var userOptions = vm.config.toc;

    hook.mounted(function () {
        var content = window.Docsify.dom.find(".content");
        if (content) {
            var nav = window.Docsify.dom.create("aside", "");
            window.Docsify.dom.toggleClass(nav, "add", "nav");
            window.Docsify.dom.before(content, nav);
        }
    });

    hook.doneEach(function () {
        var nav = document.querySelectorAll('.nav')[0]
        var t = Array.from(document.querySelectorAll('.nav'))

        if (!nav) {
            return;
        }

        const toc = buildTOC(userOptions);

        // Just unset it for now.
        if (!toc.innerHTML) {
            nav.innerHTML = null
            return;
        }

        // Fix me in the future
        var title = document.createElement('p');
        title.innerHTML = userOptions.title;
        title.setAttribute('class', 'title');

        var container = document.createElement('div');
        container.setAttribute('class', 'page_toc');

        container.appendChild(title);
        container.appendChild(toc);

        // Existing TOC
        var tocChild = document.querySelectorAll('.nav .page_toc');

        if (tocChild.length > 0) {
            tocChild[0].parentNode.removeChild(tocChild[0]);
        }

        nav.appendChild(container);

        // Add the active class
        // updateActiveTocItem();

    });
}

// Docsify plugin options
window.$docsify['toc'] = Object.assign(defaultOptions, window.$docsify['toc']);
window.$docsify.plugins = [].concat(plugin, window.$docsify.plugins);


function getIdFromUrl(url) {
    var urlObj = new URL(url);
    var hash = urlObj.hash; // 获取哈希部分，例如: #/mit_AI?id=application

    // 从哈希中提取查询字符串部分，例如: id=application
    var queryString = hash.substring(hash.indexOf('?') + 1);

    // 现在使用 URLSearchParams 来解析这部分
    var queryParams = new URLSearchParams(queryString);
    return queryParams.get('id');
}

// 用于点击事件中的 URL
function getIdFromUrlForClick(url) {
    var hashIndex = url.indexOf('#');
    return hashIndex >= 0 ? url.substring(hashIndex + 1) : null;
}

// 用于滚动事件中的 URL
function getIdFromUrlForScroll(url) {
    var urlObj = new URL(url);
    var hash = urlObj.hash;
    var queryString = hash.substring(hash.indexOf('?') + 1);
    var queryParams = new URLSearchParams(queryString);
    return queryParams.get('id');
}

var updateActiveLink = function () {
    var sections = document.querySelectorAll(defaultOptions.scope + ' ' + defaultOptions.headings);
    var tocLinks = document.querySelectorAll('.page_toc a');

    var scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;

    sections.forEach(function (section) {
        var sectionTop = section.offsetTop;
        var sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {

            tocLinks.forEach(function (link) {
                link.parentElement.classList.remove('active');
            });

            tocLinks.forEach(function (link) {
                // link.parentElement.classList.remove('active');

                var anchorId = getIdFromUrlForScroll(link.getAttribute('href'));

                if (section.getAttribute('id') === anchorId) {
                    link.parentElement.classList.add('active');
                }
            });
        }
    });
};

document.addEventListener("DOMContentLoaded", function () {

    window.addEventListener('scroll', function () {
        updateActiveLink();
    });
});