declare module "types" {
	export interface SideMenuProps {
    routes?: MenuItem[];
    projectName?: string;
    // requireLogin?: boolean;
    // hide?: boolean;
    // companyLogo?: string;
    children?: React.ReactNode;
  }

  export interface MenuItem {
    path: string;
    name: string;
    element: JSX.Element;
    icon?: FontAwesomeIconProps["icon"];
    excludeFromMenu?: boolean;
    category?: string;
    // requiredClaims?: string[];
    // sortOrder?: number,
  }
}