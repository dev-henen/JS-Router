class Router {
  constructor(rootElement = null) {
    this.routes = [];
    this.filters = [];
    this.afterRouteRender = null;
    this.notFoundPageCallback = null;
    this.errorPageCallback = null;
    this.updateTimeout = null;
    this.templateCache = new Map();
    this.templateBasePath = '';

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

  setTemplatePath(basePath) {
    this.templateBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
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
      template: (templatePath, data) => this.template(templatePath, data)
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

  async template(templatePath, data = {}) {
    try {
      let template = this.templateCache.get(templatePath);
      
      if (!template) {
        const response = await fetch(this.templateBasePath + templatePath);
        if (!response.ok) throw new Error(`Failed to load template: ${templatePath}`);
        template = await response.text();
        this.templateCache.set(templatePath, template);
      }

      return this.parseTemplate(template, data);
    } catch (error) {
      this.handleError(`Template error: ${error.message}`);
      return '';
    }
  }

  parseTemplate(template, data, parentTemplate = null) {
    // Handle template inheritance
    const extendsMatch = template.match(/{@extends\s+([^}]+)}/);
    if (extendsMatch) {
      const parentPath = extendsMatch[1].trim();
      const parentTemplate = this.templateCache.get(parentPath);
      if (!parentTemplate) {
        throw new Error(`Parent template not found: ${parentPath}`);
      }
      template = this.processBlocksInheritance(template, parentTemplate);
    }

    // Process includes
    template = template.replace(
      /{@include\s+([^}]+)}/g,
      (_, includePath) => {
        const includeTemplate = this.templateCache.get(includePath.trim());
        if (!includeTemplate) {
          throw new Error(`Include template not found: ${includePath}`);
        }
        return this.parseTemplate(includeTemplate, data);
      }
    );

    // Process conditionals
    template = this.processConditionals(template, data);

    // Process loops
    template = this.processLoops(template, data);

    // Process variables
    template = this.processVariables(template, data);

    return template;
  }

  processConditionals(template, data) {
    const ifRegex = /{@if\s+([^}]+)}([\s\S]*?){@else}([\s\S]*?){\/[@]if}/g;
    const simpleIfRegex = /{@if\s+([^}]+)}([\s\S]*?){\/[@]if}/g;

    // Process if-else blocks
    template = template.replace(ifRegex, (_, condition, ifContent, elseContent) => {
      return this.evaluateCondition(condition, data) ? 
        this.parseTemplate(ifContent, data) : 
        this.parseTemplate(elseContent, data);
    });

    // Process simple if blocks
    template = template.replace(simpleIfRegex, (_, condition, content) => {
      return this.evaluateCondition(condition, data) ? 
        this.parseTemplate(content, data) : 
        '';
    });

    return template;
  }

  processLoops(template, data) {
    return template.replace(
      /{@for\s+([^}]+)}([\s\S]*?){\/[@]for}/g,
      (_, loopDef, content) => {
        const [variable, collection] = loopDef.trim().split(/\s+in\s+/);
        const items = this.getValueFromPath(data, collection);
        
        if (!items) return '';
        
        let result = '';
        if (Array.isArray(items)) {
          items.forEach((item, index) => {
            const itemData = {
              ...data,
              [variable]: item,
              index,
              first: index === 0,
              last: index === items.length - 1
            };
            result += this.parseTemplate(content, itemData);
          });
        } else if (typeof items === 'object') {
          Object.entries(items).forEach(([key, value], index) => {
            const itemData = {
              ...data,
              [variable]: { key, value },
              index,
              first: index === 0,
              last: index === Object.keys(items).length - 1
            };
            result += this.parseTemplate(content, itemData);
          });
        }
        return result;
      }
    );
  }

  processVariables(template, data) {
    return template.replace(/{{([^}]+)}}/g, (_, path) => {
      const value = this.getValueFromPath(data, path.trim());
      return value !== undefined ? value : '';
    });
  }

  processBlocksInheritance(childTemplate, parentTemplate) {
    const blocks = new Map();
    
    // Extract blocks from child template
    childTemplate.replace(
      /{@block\s+([^}]+)}([\s\S]*?){\/[@]block}/g,
      (_, name, content) => {
        blocks.set(name.trim(), content);
        return '';
      }
    );

    // Replace blocks in parent template
    return parentTemplate.replace(
      /{@block\s+([^}]+)}([\s\S]*?){\/[@]block}/g,
      (_, name, defaultContent) => {
        return blocks.get(name.trim()) || defaultContent;
      }
    );
  }

  evaluateCondition(condition, data) {
    const safeEval = (exp, context) => {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const evalFn = new Function(...keys, `return ${exp};`);
      return evalFn(...values);
    };

    try {
      // Replace template variables in condition
      const processedCondition = condition.replace(/\$\{([^}]+)\}/g, (_, path) => {
        const value = this.getValueFromPath(data, path.trim());
        return typeof value === 'string' ? `"${value}"` : value;
      });

      return safeEval(processedCondition, data);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  getValueFromPath(obj, path) {
    return path.split('.').reduce((current, part) => {
      return current && current[part] !== undefined ? current[part] : undefined;
    }, obj);
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