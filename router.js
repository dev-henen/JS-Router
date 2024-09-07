class Router {
  constructor(rootElement = null) {
    this.routes = [];
    this.filters = [];
    this.afterRouteRender = null;
    this.notFoundPageCallback = null;
    this.errorPageCallback = null;
    this.updateTimeout = null;

    this.setRootElement(rootElement);
    this.bindEvents();
  }

  setRootElement(rootElement) {
    if (rootElement) {
      if (rootElement instanceof HTMLElement) {
        this.rootElement = rootElement;
      } else {
        this.handleError("Invalid root element passed.");
      }
    } else {
      this.rootElement = document.getElementById("root");
      if (!this.rootElement) {
        this.handleError("No root element found with id 'root'.");
      }
    }
  }

  addRoute(path, callback, dynamicUpdate = { update: false, interval: 5000 }, afterRender = null) {
    this.routes.push({
      path,
      load: callback,
      afterRender,
      dynamicUpdate,
      getParam: (param) => this.getUrlParam(param),
      addParam: (param, value) => this.addUrlParam(param, value),
      replaceParam: (param, value) => this.replaceUrlParam(param, value),
      match: (path) => this.matchRoutePattern(path, path),
      getPathParam: (param) => this.getPathParam(param, path),
    });
  }

  setAfterRouteRender(callback) {
    this.afterRouteRender = callback;
  }

  setNotFoundPage(callback) {
    this.notFoundPageCallback = callback;
  }

  setErrorPage(callback) {
    this.errorPageCallback = callback;
  }

  addFilter(pathPattern, callback) {
    this.filters.push({ pathPattern, callback });
  }

  async handleFilter(path) {
    for (const filter of this.filters) {
      if (this.matchRoutePattern(path, filter.pathPattern)) {
        try {
          await filter.callback(path);
        } catch (error) {
          this.handleError(`Error in filter for path ${path}: ${error.message}`, 'Filter Error');
        }
      }
    }
  }

  handleError(message, errorType = 'Error') {
    console.error(message);
    if (this.errorPageCallback) {
      this.errorPageCallback(errorType, message).then(content => {
        if (this.rootElement) {
          this.rootElement.innerHTML = content;
        }
      });
    } else {
      if (this.rootElement) {
        this.rootElement.innerHTML = `<h1>${errorType}: ${message}</h1>`;
      }
    }
  }

  async loadPage(path) {
    const route = this.routes.find(route => this.matchRoutePattern(path, route.path));
    if (!route) {
      if (this.notFoundPageCallback) {
        const content = await this.notFoundPageCallback();
        if (this.rootElement) {
          this.rootElement.innerHTML = content;
        }
      } else {
        this.handleError(`Route not found: ${path}`, '404 Not Found');
      }
      return null;
    }

    try {
      const content = await route.load.call(route);
      return content;
    } catch (error) {
      this.handleError(`Error loading content for path ${path}: ${error.message}`, 'Load Error');
      return null;
    }
  }

  async render(path) {
    await this.handleFilter(path);
    const content = await this.loadPage(path);
    if (content !== null) {
      this.rootElement.innerHTML = content;
      if (this.afterRouteRender) {
        this.afterRouteRender(path);
      }

      const route = this.routes.find(route => this.matchRoutePattern(path, route.path));
      if (route && route.afterRender) {
        route.afterRender(path);
      }

      this.updateRoute(path);
    }
  }

  handleNavigation(pathname) {
    window.history.pushState({}, pathname, window.location.origin + pathname);
    this.render(pathname);
  }

  async updateRoute(path) {
    const route = this.routes.find(route => this.matchRoutePattern(path, route.path));
    if (!route) {
      this.handleError(`Route not found: ${path}`, '404 Not Found');
      return;
    }

    if (!route.dynamicUpdate || !route.dynamicUpdate.update) {
      return;
    }

    this.clearTimeout();
    const content = await this.loadPage(path);
    const currentContent = this.rootElement.innerHTML;
    const currentPath = window.location.pathname;

    if (currentPath !== path) {
      return;
    }

    if (content !== currentContent) {
      this.rootElement.innerHTML = content;
      if (this.afterRouteRender) {
        this.afterRouteRender(path);
      }

      if (route.afterRender) {
        route.afterRender(path);
      }
    }

    this.updateTimeout = setTimeout(() => this.updateRoute(path), route.dynamicUpdate.interval);
  }

  clearTimeout() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }

  bindEvents() {
    window.onload = () => this.render(window.location.pathname);
    window.onpopstate = () => this.render(window.location.pathname);
    document.addEventListener("click", (event) => {
      const { target } = event;
      if (target.tagName === "A" && target.href.startsWith(window.location.origin)) {
        event.preventDefault();
        this.clearTimeout();
        this.handleNavigation(new URL(target.href).pathname);
      }
    });
  }

  getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  addUrlParam(param, value) {
    const url = new URL(window.location.href);
    url.searchParams.append(param, value);
    window.history.pushState({}, '', url);
  }

  replaceUrlParam(param, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  }

  matchRoutePattern(path, pattern) {
    const regexPattern = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/:([\w]+)/g, '([^/]+)')}$`);
    return regexPattern.test(path);
  }

  getPathParam(param, routePattern) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const patternSegments = routePattern.split('/').filter(Boolean);

    if (routePattern.includes('*')) {
      const wildcardIndex = patternSegments.indexOf('*');
      const remainingPath = pathSegments.slice(wildcardIndex).join('/');
      return param === 'section' ? remainingPath : null;
    }

    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(':')) {
        const patternParam = patternSegments[i].substring(1);
        if (patternParam === param) {
          return pathSegments[i];
        }
      }
    }
    return null;
  }
}
