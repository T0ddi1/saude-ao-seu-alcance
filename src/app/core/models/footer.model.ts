import { IconGlyph } from './home.model';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterLinkColumn {
  title: string;
  links: FooterLink[];
}

export interface SpecialProject {
  icon: IconGlyph;
  title: string;
  description: string;
  href: string;
}

export interface SocialLink {
  icon: 'facebook' | 'instagram' | 'youtube' | 'linkedin';
  href: string;
  label: string;
}

export interface FooterData {
  tagline: string;
  columns: FooterLinkColumn[];
  social: SocialLink[];
  newsletter: {
    title: string;
    description: string;
    placeholder: string;
    ctaLabel: string;
  };
  specialProjects: SpecialProject[];
}
