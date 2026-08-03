export interface SubmenuItem {
  label: string;
  href: string;
}

export interface SubmenuColumn {
  title: string;
  items: SubmenuItem[];
}

export interface NavItem {
  label: string;
  href: string;
  columns?: SubmenuColumn[];
}
