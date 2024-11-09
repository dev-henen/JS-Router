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









# Router Template Engine Documentation

A powerful template engine integrated into the Router framework that supports variables, conditionals, loops, includes, and template inheritance.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Template Syntax](#template-syntax)
- [Template Inheritance](#template-inheritance)
- [Including Templates](#including-templates)
- [Complete Examples](#complete-examples)

## Basic Usage

Initialize the router and set the template path:

```javascript
const router = new Router();
router.setTemplatePath('/templates/');

// Using templates in routes
router.addRoute('/users', async function() {
  const data = {
    users: [
      { name: 'John', role: 'admin', active: true },
      { name: 'Jane', role: 'user', active: true },
      { name: 'Bob', role: 'user', active: false }
    ],
    title: 'User Management',
    isAdmin: true
  };
  
  return this.template('users/list.htm', data);
});
```

## Template Syntax

### Variables

Simple variable output:
```html
<h1>{{title}}</h1>
<p>Welcome, {{user.name}}!</p>
```

### Conditionals

Basic if condition:
```html
{@if isAdmin}
  <button class="admin-btn">Admin Panel</button>
{/@if}
```

If-else condition:
```html
{@if user.active}
  <span class="status-badge green">Active</span>
{@else}
  <span class="status-badge red">Inactive</span>
{/@if}
```

Nested conditions:
```html
{@if user.role === 'admin'}
  <div class="admin-panel">
    {@if user.permissions.canDelete}
      <button>Delete Users</button>
    {/@if}
  </div>
{/@if}
```

### Loops

Array loop:
```html
<ul class="user-list">
  {@for user in users}
    <li class="user-item">
      <h3>{{user.name}}</h3>
      <p>Role: {{user.role}}</p>
      {@if user.active}
        <span class="active">●</span>
      {/@if}
    </li>
  {/@for}
</ul>
```

Object loop:
```html
<dl class="metadata">
  {@for item in metadata}
    <dt>{{item.key}}</dt>
    <dd>{{item.value}}</dd>
  {/@for}
</dl>
```

Loop with index and special variables:
```html
<div class="gallery">
  {@for image in images}
    <div class="image-card {@if first}first{/@if} {@if last}last{/@if}">
      <span>Image {{index + 1}}</span>
      <img src="{{image.url}}" alt="{{image.title}}">
    </div>
  {/@for}
</div>
```

## Template Inheritance

### Base Template (layout.htm)
```html
<!DOCTYPE html>
<html>
<head>
  <title>{@block title}Default Title{/@block}</title>
  {@block styles}
    <link rel="stylesheet" href="/css/main.css">
  {/@block}
</head>
<body>
  <header>
    {@block header}
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    {/@block}
  </header>

  <main>
    {@block content}{/@block}
  </main>

  <footer>
    {@block footer}
      <p>&copy; 2024 My Website</p>
    {/@block}
  </footer>
</body>
</html>
```

### Child Template (users.htm)
```html
{@extends layout.htm}

{@block title}User List - My Website{/@block}

{@block styles}
  {@parent}
  <link rel="stylesheet" href="/css/users.css">
{/@block}

{@block content}
  <h1>{{title}}</h1>
  
  {@if isAdmin}
    <div class="admin-controls">
      <button>Add User</button>
    </div>
  {/@if}

  <div class="user-grid">
    {@for user in users}
      <div class="user-card">
        <h3>{{user.name}}</h3>
        <p>Role: {{user.role}}</p>
        {@if user.active}
          <span class="status active">Active</span>
        {@else}
          <span class="status inactive">Inactive</span>
        {/@if}
      </div>
    {/@for}
  </div>
{/@block}
```

## Including Templates

### Partial Template (user-card.htm)
```html
<div class="user-card">
  <h3>{{user.name}}</h3>
  <p>Role: {{user.role}}</p>
  {@if user.active}
    <span class="status active">Active</span>
  {@else}
    <span class="status inactive">Inactive</span>
  {/@if}
  {@if user.lastLogin}
    <p class="last-login">Last login: {{user.lastLogin}}</p>
  {/@if}
</div>
```

### Main Template Using Include
```html
{@extends layout.htm}

{@block content}
  <h1>{{title}}</h1>
  
  <div class="user-grid">
    {@for user in users}
      {@include user-card.htm}
    {/@for}
  </div>
{/@block}
```

## Complete Examples

### JavaScript Implementation
```javascript
// Route setup with template and data
router.addRoute('/dashboard', async function() {
  const data = {
    user: {
      name: 'John Doe',
      role: 'admin',
      permissions: {
        canEdit: true,
        canDelete: true
      }
    },
    stats: {
      users: 1234,
      posts: 5678,
      comments: 9012
    },
    recentActivity: [
      { type: 'post', user: 'Jane', time: '2 hours ago' },
      { type: 'comment', user: 'Bob', time: '5 hours ago' }
    ],
    settings: {
      theme: 'dark',
      notifications: true
    }
  };
  
  return this.template('dashboard/main.htm', data);
});
```

### Dashboard Template (dashboard/main.htm)
```html
{@extends layout.htm}

{@block title}Dashboard - Admin Panel{/@block}

{@block content}
  <div class="dashboard">
    <!-- Header Section -->
    <header class="dashboard-header">
      <h1>Welcome, {{user.name}}</h1>
      {@if user.role === 'admin'}
        <div class="admin-badge">Administrator</div>
      {/@if}
    </header>

    <!-- Stats Section -->
    <section class="stats-grid">
      {@for stat in stats}
        <div class="stat-card">
          <h3>{{stat.key}}</h3>
          <div class="stat-value">{{stat.value}}</div>
        </div>
      {/@for}
    </section>

    <!-- Recent Activity -->
    <section class="activity-feed">
      <h2>Recent Activity</h2>
      {@if recentActivity.length > 0}
        <ul>
          {@for activity in recentActivity}
            <li class="activity-item type-{{activity.type}}">
              <span class="user">{{activity.user}}</span>
              <span class="time">{{activity.time}}</span>
            </li>
          {/@for}
        </ul>
      {@else}
        <p>No recent activity</p>
      {/@if}
    </section>

    <!-- Settings Panel -->
    <section class="settings-panel">
      <h2>Settings</h2>
      {@include dashboard/settings.htm}
    </section>
  </div>
{/@block}
```

### Settings Partial (dashboard/settings.htm)
```html
<div class="settings-grid">
  {@for setting in settings}
    <div class="setting-item">
      <label>{{setting.key}}</label>
      {@if typeof setting.value === 'boolean'}
        <input type="checkbox" {@if setting.value}checked{/@if}>
      {@else}
        <input type="text" value="{{setting.value}}">
      {/@if}
    </div>
  {/@for}
</div>
```

## Special Features

### Loop Variables
Inside `{@for}` loops, you have access to special variables:
- `index`: Current iteration index (0-based)
- `first`: Boolean indicating if this is the first iteration
- `last`: Boolean indicating if this is the last iteration

### Conditional Operators
The template engine supports standard JavaScript comparison operators in conditions:
- `===`, `!==`: Strict equality/inequality
- `>`, `<`, `>=`, `<=`: Numeric comparisons
- `&&`, `||`: Logical AND/OR
- `typeof`: Type checking

### Access to Nested Properties
You can access deeply nested object properties using dot notation:
```html
{{user.profile.address.city}}
```

### Safe Evaluation
The template engine safely evaluates conditions and prevents execution of arbitrary JavaScript code.