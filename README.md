# SUI App - Modern Web Application

A modern, full-stack web application built with Next.js 14, TypeScript, and Tailwind CSS. This project provides a solid foundation for building scalable web applications with best practices built-in.

## 🚀 Features

- **Next.js 14** with App Router for optimal performance
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling with custom design system
- **Radix UI** components for accessible, unstyled UI primitives
- **Responsive Design** that works on all devices
- **Modern Architecture** with clean separation of concerns
- **Custom Hooks** for common functionality
- **Form Components** with validation
- **Layout System** with header, footer, and main content areas

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── globals.css        # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # Reusable components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ui/               # Base UI components
├── constants/            # Application constants
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── utils/                # Additional utilities
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Font**: Geist Sans & Geist Mono
- **Package Manager**: npm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sui-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## 🎨 Design System

The project includes a comprehensive design system with:

- **Color Palette**: Primary, secondary, accent, and semantic colors
- **Typography**: Consistent font sizing and spacing
- **Components**: Reusable UI components with variants
- **Layout**: Responsive grid system and spacing utilities
- **Dark Mode**: Built-in dark mode support

## 🔧 Customization

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file
3. Use the `Layout` component for consistent structure

### Creating Components

1. Add components to `src/components/`
2. Use TypeScript interfaces for props
3. Follow the existing naming conventions
4. Export components from index files

### Styling

- Use Tailwind CSS classes for styling
- Create custom CSS variables in `globals.css`
- Follow the design system patterns
- Use the `cn()` utility for conditional classes

## 📱 Responsive Design

The application is built with a mobile-first approach:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

## 🔒 Security

- Input validation on forms
- TypeScript for type safety
- ESLint for code quality
- Secure defaults in Next.js

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

1. Build the application: `npm run build`
2. Start the production server: `npm run start`
3. Deploy the `.next` folder to your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you have any questions or need help, please:

1. Check the documentation
2. Search existing issues
3. Create a new issue with details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Radix UI for accessible component primitives
- Vercel for hosting and deployment platform