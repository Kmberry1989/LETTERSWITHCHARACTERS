export type InterfaceTheme = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  background: string;
  sidebar: string;
  sidebarAccent: string;
};

export const INTERFACE_THEMES: InterfaceTheme[] = [
  { id: 'default', name: 'Storybook Red', primary: '5 72% 53%', accent: '43 96% 63%', background: '35 100% 97%', sidebar: '28 100% 98%', sidebarAccent: '25 64% 92%' },
  { id: 'forest', name: 'Forest Parade', primary: '145 58% 36%', accent: '44 89% 62%', background: '98 42% 96%', sidebar: '98 38% 98%', sidebarAccent: '97 32% 90%' },
  { id: 'ocean', name: 'Bubble Blue', primary: '204 82% 47%', accent: '189 83% 61%', background: '196 100% 97%', sidebar: '194 100% 98%', sidebarAccent: '194 56% 92%' },
  { id: 'sunset', name: 'Sunset Pop', primary: '18 90% 54%', accent: '335 88% 69%', background: '27 100% 97%', sidebar: '24 100% 98%', sidebarAccent: '18 78% 92%' },
  { id: 'candy', name: 'Candy Burst', primary: '326 73% 54%', accent: '171 67% 56%', background: '329 100% 98%', sidebar: '0 0% 100%', sidebarAccent: '326 76% 94%' },
  { id: 'mono', name: 'Ink and Paper', primary: '222 24% 18%', accent: '36 26% 62%', background: '42 20% 95%', sidebar: '0 0% 100%', sidebarAccent: '38 20% 90%' },
];

export function getInterfaceTheme(themeId?: string | null) {
  return INTERFACE_THEMES.find((theme) => theme.id === themeId) || INTERFACE_THEMES[0];
}
