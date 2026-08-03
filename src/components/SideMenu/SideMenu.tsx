// src/components/SideMenu/SideMenu.tsx
import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SideMenuProps } from 'types'
import './SideMenu.css'

function SideMenu(props: SideMenuProps) {
  const { routes, projectName, children } = props
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  // Group routes by category
  const groupedRoutes = routes
    ?.filter(route => !route.excludeFromMenu)
    .reduce((acc, route) => {
      const category = route.category || 'Other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(route)
      return acc
    }, {} as Record<string, typeof routes>)

  // Define category order
  const categoryOrder = [
    'Text & Content',
    'Web Development',
    'Data & Formatting',
    'Security & Encoding',
    'Developer Tools',
    'File & Image',
    'Other'
  ]

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  return (
    <div className="sidemenu-wrapper">
      <div className="sidebar">
        <h3>{projectName}</h3>
        <nav>
          {categoryOrder.map(category => {
            const categoryRoutes = groupedRoutes?.[category]
            if (!categoryRoutes || categoryRoutes.length === 0) return null

            const isCollapsed = collapsedCategories.has(category)

            return (
              <div key={category} className="menu-category">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <span className={`category-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  {category}
                </div>
                <div className={`category-items ${isCollapsed ? 'collapsed' : ''}`}>
                  {categoryRoutes.map((route) => (
                    <NavLink
                      key={route.path}
                      to={route.path}
                      className={({ isActive }) => (isActive ? 'active' : '')}
                    >
                      {route.icon && <FontAwesomeIcon icon={route.icon} />}
                      {route.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
      <div className="content">
        {children}
      </div>
    </div>
  )
}

export default SideMenu
