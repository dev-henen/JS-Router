# Custom JavaScript Router

## Overview

This router provides flexible handling for single-page application (SPA) navigation. It supports dynamic routes, filters, custom error pages, and dynamic content updates. Below, each method of the `Router` class is explained in detail with usage examples.

## Methods

### `constructor(rootElement = null)`

**Description**: Initializes a new `Router` instance. Optionally, pass a root element where the content will be rendered. If no root element is passed, the router will look for an element with the ID `root`.

**Usage Example**:

```javascript
const router = new Router(document.getElementById('app'));
```

**Parameters**:
- `rootElement`: (Optional) An HTML element where the content will be rendered.

### `addRoute(path, callback, dynamicUpdate = { update: false, interval: 5000 }, afterRender = null)`

**Description**: Adds a route to the router with a specified path and callback function. Optionally, configure dynamic updates and an after render callback.

**Usage Example**:

```javascript
router.addRoute('/', async function() {
  return '<h1>Home Page</h1>';
});

router.addRoute('/profile/:id', function() {
  let id = this.getPathParam('id');
  return `<h1>Profile ID: ${id}</h1>`;
}, { update: true, interval: 5000 });
```

**Parameters**:
- `path`: The URL path for the route. Use `:` for dynamic parameters and `*` for wildcards.
- `callback`: A function that returns the HTML content for this route.
- `dynamicUpdate`: (Optional) Configuration for dynamic updates. Defaults to `{ update: false, interval: 5000 }`.
  - `update`: Boolean indicating whether to enable dynamic updates.
  - `interval`: Time in milliseconds between content updates.
- `afterRender`: (Optional) A callback function that will be executed after the route is rendered.

### `setAfterRouteRender(callback)`

**Description**: Sets a global callback that will be called after any route is rendered.

**Usage Example**:

```javascript
router.setAfterRouteRender((path) => {
  console.log(`Rendered path: ${path}`);
});
```

**Parameters**:
- `callback`: A function that will be executed after the route is rendered. Receives the current path as an argument.

### `setNotFoundPage(callback)`

**Description**: Sets a custom callback for handling 404 (Not Found) pages.

**Usage Example**:

```javascript
router.setNotFoundPage(async () => {
  return '<h1>404 - Page Not Found</h1>';
});
```

**Parameters**:
- `callback`: A function that returns the HTML content for the 404 page. It will be called when a route is not found.

### `setErrorPage(callback)`

**Description**: Sets a custom callback for handling errors. This callback can be triggered with optional error type and message.

**Usage Example**:

```javascript
router.setErrorPage(async (errorType, message) => {
  return `<h1>${errorType}: ${message}</h1>`;
});
```

**Parameters**:
- `callback`: A function that returns the HTML content for the error page. Receives `errorType` and `message` as arguments.

### `addFilter(pathPattern, callback)`

**Description**: Adds a filter that will be called before the route callback when the URL matches the filter pattern.

**Usage Example**:

```javascript
router.addFilter('/admin', async (path) => {
  console.log(`Filter applied to path: ${path}`);
});

router.addFilter('*', async (path) => {
  console.log(`Global filter applied to path: ${path}`);
});
```

**Parameters**:
- `pathPattern`: The pattern to match URLs against. Use `*` for a global filter.
- `callback`: A function that will be executed when the URL matches the pattern. Receives the current path as an argument.

### `getPathParam(param)`

**Description**: Retrieves a path parameter value from the URL based on the route pattern.

**Usage Example**:

```javascript
router.addRoute('/user/:id', function() {
  let userId = this.getPathParam('id');
  return `<h1>User ID: ${userId}</h1>`;
});
```

**Parameters**:
- `param`: The name of the path parameter to retrieve.

### `addParam(param, value)`

**Description**: Adds a parameter to the URL.

**Usage Example**:

```javascript
router.addParam('newParam', 'value');
```

**Parameters**:
- `param`: The name of the parameter to add.
- `value`: The value of the parameter.

### `replaceParam(param, value)`

**Description**: Replaces an existing parameter in the URL.

**Usage Example**:

```javascript
router.replaceParam('existingParam', 'newValue');
```

**Parameters**:
- `param`: The name of the parameter to replace.
- `value`: The new value of the parameter.

### `matchRoutePattern(path, pattern)`

**Description**: Matches a path to a route pattern. This is used internally to find the best matching route.

**Usage Example**:

This method is used internally and does not need to be called directly. It helps in determining which route should handle the given path.

**Parameters**:
- `path`: The URL path to match.
- `pattern`: The route pattern to match against.

### `handleNavigation(pathname)`

**Description**: Handles programmatic navigation. It updates the browser's history and renders the content for the given path.

**Usage Example**:

```javascript
router.handleNavigation('/profile/123');
```

**Parameters**:
- `pathname`: The URL path to navigate to.

## Example

Here is a complete example demonstrating how to use the router:

### HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPA Router Example</title>
  <script src="router.js" defer></script>
  <script src="app.js" defer></script>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/profile/123">Profile</a>
    <a href="/admin/settings">Admin Settings</a>
    <a href="/dynamic">Dynamic</a>
  </nav>
  <div id="app"></div>
</body>
</html>
```

### JavaScript (`app.js`)

```javascript
document.addEventListener("DOMContentLoaded", () => {
  const router = new Router(document.getElementById('app'));

  router.addRoute('/', async function() {
    return '<h1>Home Page</h1>';
  });

  router.addRoute('/profile/:id', function() {
    let id = this.getPathParam('id');
    return `<h1>Profile ID: ${id}</h1>`;
  });

  router.addRoute('/admin/*', function() {
    let section = this.getPathParam('section');
    return `<h1>Admin Section: ${section}</h1>`;
  });

  router.setAfterRouteRender((path) => {
    console.log(`Rendered path: ${path}`);
  });

  router.setNotFoundPage(async () => {
    return '<h1>404 - Page Not Found</h1>';
  });

  router.setErrorPage(async (errorType, message) => {
    return `<h1>${errorType}: ${message}</h1>`;
  });

  router.addFilter('/admin', async (path) => {
    console.log(`Filter applied to path: ${path}`);
  });

  router.addFilter('*', async (path) => {
    console.log(`Global filter applied to path: ${path}`);
  });

  router.addRoute('/dynamic', async function() {
    return `<h1>Dynamic Content</h1><p>${new Date()}</p>`;
  }, { update: true, interval: 5000 });

  document.addEventListener("click", (event) => {
    const { target } = event;
    if (target.tagName === "A" && target.href.startsWith(window.location.origin)) {
      event.preventDefault();
      router.handleNavigation(new URL(target.href).pathname);
    }
  });
});
```

## Summary

- **Initialization**: Create a new `Router` instance and optionally specify the root element for rendering.
- **Adding Routes**: Define routes with dynamic parameters and wildcards, and set up callbacks for rendering content.
- **After Route Render**: Set global after render callbacks.
- **Custom 404 and Error Pages**: Define custom handling for not found and error pages.
- **Filters**: Add pre-processing logic for routes.
- **Dynamic Updates**: Enable periodic updates for dynamic content.
- **URL Parameters**: Manage URL parameters with methods for getting, adding, and replacing them.
- **Programmatic Navigation**: Use `handleNavigation` for programmatic route changes.

This comprehensive explanation and example code should help you effectively implement and use this custom router in your SPA.