# TerraMiner Design System

This document outlines the design system used throughout the TerraMiner application to ensure consistency in the user interface and experience.

## Color Palette

### Primary Colors
- **Primary Blue**: `#2196F3` - Main brand color used for primary actions, key UI elements
- **Primary Dark Blue**: `#0D47A1` - Used for hover states and emphasis
- **Secondary Teal**: `#00BCD4` - Secondary brand color used for accents and highlights
- **Accent Cyan**: `#00E5FF` - Bright accent used sparingly for emphasis

### Functional Colors
- **Success Green**: `#4CAF50` - Used for success states, confirmations
- **Warning Amber**: `#FFC107` - Used for warnings, alerts that need attention
- **Danger Red**: `#F44336` - Used for errors, destructive actions
- **Info Blue**: `#03A9F4` - Used for informational states

### Background Colors
- **Dark Background**: `#1A237E` - Used for main navigation and headers
- **Medium Background**: `#283593` - Used for secondary navigation elements
- **Light Background**: `#3949AB` - Used for active states, selected items
- **Card Background (Light)**: `#FFFFFF` - Used for cards and content containers
- **Card Background (Dark)**: `#263238` - Used for dark mode cards

### Text Colors
- **Primary Text**: `#212121` - Main text color
- **Secondary Text**: `#757575` - Secondary text, labels
- **Muted Text**: `#9E9E9E` - Hint text, disabled states
- **Light Text**: `#FAFAFA` - Text on dark backgrounds

## Typography

### Font Family
- **Primary Font**: System font stack (San Francisco, Segoe UI, Roboto)
- **Monospace**: For code snippets and technical data

### Font Sizes
- **Base Size**: 16px (1rem)
- **Small**: 0.875rem
- **Large**: 1.25rem
- **Extra Large**: 1.5rem
- **Heading 1**: 2.25rem
- **Heading 2**: 1.75rem
- **Heading 3**: 1.5rem
- **Heading 4**: 1.25rem
- **Heading 5**: 1.125rem
- **Heading 6**: 1rem (bold)

## Spacing

- **Extra Small (xs)**: 0.25rem (4px)
- **Small (sm)**: 0.5rem (8px)
- **Medium (md)**: 1rem (16px)
- **Large (lg)**: 1.5rem (24px)
- **Extra Large (xl)**: 2rem (32px)

## Components

### Buttons

#### Primary Button
```html
{% from "components/ui_components.html" import button %}
{{ button("Submit", "primary") }}
```

#### Outline Button
```html
{% from "components/ui_components.html" import button %}
{{ button("Cancel", "secondary", outline=true) }}
```

#### Icon Button
```html
{% from "components/ui_components.html" import icon_button %}
{{ icon_button("trash", tooltip="Delete item", type="danger", outline=true) }}
```

#### Action Button (Link or JS action)
```html
{% from "components/ui_components.html" import action_button %}
{{ action_button("View Details", "primary", "eye", url=url_for('some_route')) }}
```

### Cards

#### Basic Card
```html
{% from "components/ui_components.html" import card %}
{% call card(title="Card Title", subtitle="Optional subtitle", icon="graph-up") %}
    Card content goes here
{% endcall %}
```

#### Stat Card
```html
{% from "components/ui_components.html" import stat_card %}
{{ stat_card(
    title="Total Properties", 
    value="2,547", 
    subtitle="Last updated: Today", 
    icon="building",
    change="+12% from last month",
    change_type="positive"
) }}
```

### Tables

#### Data Table
```html
{% from "components/ui_components.html" import data_table %}
{% call data_table("unique-id", ["Name", "Email", "Role", "Actions"]) %}
    <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
        <td>
            <button class="btn btn-sm btn-outline-primary">Edit</button>
        </td>
    </tr>
{% endcall %}
```

### Badges

#### Status Badge
```html
{% from "components/ui_components.html" import status_badge %}
{{ status_badge("active") }}
{{ status_badge("error") }}
```

#### Metric Badge
```html
{% from "components/ui_components.html" import metric_badge %}
{{ metric_badge("42", "requests/sec", "primary", "hdd") }}
```

### Charts

```html
{% from "components/ui_components.html" import chart_container %}
{{ chart_container(
    id="my-chart",
    title="Revenue Growth",
    subtitle="Monthly revenue over time",
    height="400px"
) }}
```

### Loading States

#### Skeleton Card
```html
{% from "components/loading_states.html" import skeleton_card %}
{{ skeleton_card(height="200px") }}
```

#### Loading Spinner
```html
{% from "components/loading_states.html" import loading_spinner %}
{{ loading_spinner(size="lg", text="Loading data...") }}
```

#### Data Loading Container
```html
{% from "components/loading_states.html" import data_loading_container %}
{{ data_loading_container(id="data-container", message="Fetching properties...") }}
```

#### Skeleton Table
```html
{% from "components/loading_states.html" import skeleton_table %}
{{ skeleton_table(rows=5, cols=4) }}
```

#### Skeleton Chart
```html
{% from "components/loading_states.html" import skeleton_chart %}
{{ skeleton_chart(height="300px") }}
```

#### Shimmer Effect
```html
{% from "components/loading_states.html" import shimmer_container %}
{{ shimmer_container(height="100px") }}
```

### Error States

#### Error Alert
```html
{% from "components/error_states.html" import error_alert %}
{{ error_alert("Unable to fetch data from server", title="Connection Error") }}
```

#### Data Error
```html
{% from "components/error_states.html" import data_error %}
{{ data_error(message="Failed to load property data", retry_function="loadProperties()") }}
```

#### API Error
```html
{% from "components/error_states.html" import api_error %}
{{ api_error(status_code=404, message="The requested property could not be found") }}
```

#### Empty State
```html
{% from "components/error_states.html" import empty_state %}
{{ empty_state(
    message="No properties match your search criteria", 
    icon="search", 
    action_button=true,
    action_text="Clear filters",
    action_url=url_for('properties', clear=1)
) }}
```

## Form Elements

#### Form Group
```html
{% from "components/ui_components.html" import form_group %}
{{ form_group(
    label="Email Address",
    id="email",
    input_type="email",
    value=user.email,
    placeholder="Enter your email",
    required=true,
    help_text="We'll never share your email with anyone else."
) }}
```

#### Select Group
```html
{% from "components/ui_components.html" import select_group %}
{{ select_group(
    label="Property Type",
    id="property_type",
    options=[
        {"value": "residential", "text": "Residential"},
        {"value": "commercial", "text": "Commercial"},
        {"value": "industrial", "text": "Industrial"}
    ],
    selected_value=property.type,
    required=true
) }}
```

## Navigation

#### Tab Navigation
```html
{% from "components/ui_components.html" import tab_nav %}
{{ tab_nav(
    id="property-tabs",
    tabs=[
        {"id": "details", "title": "Details", "icon": "info-circle"},
        {"id": "history", "title": "History", "icon": "clock-history"},
        {"id": "pricing", "title": "Pricing", "icon": "cash"}
    ],
    active_tab="details"
) }}
```

#### Pagination
```html
{% from "components/ui_components.html" import pagination %}
{{ pagination(
    current_page=2,
    total_pages=5,
    url_pattern=url_for('properties', page='{page}')
) }}
```

## CSS Utilities

### Border Utilities
- **Border Left Primary**: `.border-left-primary`
- **Border Left Success**: `.border-left-success`
- **Border Left Info**: `.border-left-info`
- **Border Left Warning**: `.border-left-warning`
- **Border Left Danger**: `.border-left-danger`
- **Border Left Secondary**: `.border-left-secondary`

### Background Utilities
- **Primary Light Background**: `.bg-light-primary`
- **Success Light Background**: `.bg-light-success`
- **Warning Light Background**: `.bg-light-warning`
- **Danger Light Background**: `.bg-light-danger`
- **Info Light Background**: `.bg-light-info`

## Best Practices

1. **Consistent Spacing**: Use the defined spacing variables for margins and padding
2. **Color Usage**: Stick to the defined color palette for all UI elements
3. **Loading States**: Always use loading indicators when fetching data
4. **Error Handling**: Use appropriate error states for different failure scenarios
5. **Empty States**: Provide clear empty states when no data is available
6. **Responsive Design**: Ensure all UI elements work well on all screen sizes
7. **Accessibility**: Maintain proper contrast ratios and provide alternative text for images

## Implementation Pattern

For optimal implementation of the design system:

1. Import component macros at the top of the template
2. Use native components for the legacy template and design system components for the unified template
3. Wrap UI-specific code in conditional blocks based on the template preference:

```html
{% if ui_template == "unified" %}
    {# Unified UI implementation using components #}
    {{ component_macro(params) }}
{% else %}
    {# Legacy UI implementation #}
    <div class="legacy-element">...</div>
{% endif %}
```