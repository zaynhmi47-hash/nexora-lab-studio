import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Type,
  Maximize2,
  Box,
  Palette,
  CheckCircle2,
  Info,
  Sliders,
  Shield,
  Search,
} from 'lucide-react';
import { colors, typography, spacing, radius, shadows } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import {
  Button,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DestructiveButton,
  OutlineButton,
  SoftButton,
  SuccessButton,
  IconButton,
} from '../../components/ui/Button';
import { TextInput, SearchInput, Select, SegmentedControl } from '../../components/ui/Input';
import { Badge, Chip } from '../../components/ui/Badge';
import { ProgressBar, ProgressRing } from '../../components/ui/ProgressBar';
import { Alert, EmptyState, LoadingState, ErrorState } from '../../components/ui/FeedbackStates';
import { Modal, BottomSheet, Drawer } from '../../components/ui/Overlay';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '../../components/ui/Card';

export const DesignSystemShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<
    'tokens' | 'buttons' | 'inputs' | 'feedback' | 'overlays'
  >('tokens');

  // Overlay states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Input states
  const [textInputVal, setTextInputVal] = useState('Senior Systems Architect');
  const [searchVal, setSearchVal] = useState('Consensus');
  const [selectVal, setSelectVal] = useState('advanced');
  const [segVal, setSegVal] = useState('tab1');

  const currentThemeColors = colors[theme];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Design System & Token Architecture
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized design tokens, standardized typography hierarchy, spacing math, and reusable components.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SecondaryButton size="sm" onClick={toggleTheme}>
            Toggle Mode: {theme.toUpperCase()}
          </SecondaryButton>
        </div>
      </div>

      {/* Showcase Nav Tabs */}
      <SegmentedControl
        value={activeSection}
        onChange={(v) => setActiveSection(v as any)}
        options={[
          { value: 'tokens', label: 'Tokens (Colors, Type, Spacing, Radius)' },
          { value: 'buttons', label: 'Buttons & Controls' },
          { value: 'inputs', label: 'Inputs & Form Elements' },
          { value: 'feedback', label: 'Badges, Rings & States' },
          { value: 'overlays', label: 'Overlays (Modal, Sheet, Drawer)' },
        ]}
      />

      {/* SECTION 1: TOKENS */}
      {activeSection === 'tokens' && (
        <div className="space-y-10">
          {/* Colors */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Semantic Color Palette ({theme} mode active)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(currentThemeColors).map(([name, hex]) => (
                <div
                  key={name}
                  className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 select-all">{hex}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Typography Scale */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Typography Scale (Plus Jakarta Sans)
            </h3>
            <Card padding="md">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">Display (40px)</span>
                  <span className="text-4xl font-extrabold tracking-tight">Education Super-Platform</span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">H1 (32px)</span>
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight">Master Distributed Architectures</span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">H2 (24px)</span>
                  <span className="text-xl font-bold tracking-tight">Consensus & Fault Tolerance</span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">H3 (20px)</span>
                  <span className="text-lg font-semibold">Active Syllabus Modules</span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">Body Large (18px)</span>
                  <span className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
                    Comprehensive curricula structured for university learners and industry practitioners.
                  </span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">Body (16px)</span>
                  <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    Standard body copy optimized with a 1.625 line height ratio for maximal readability.
                  </span>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-28">Label / Button</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Verified Competency Certificate
                  </span>
                </div>
              </div>
            </Card>
          </section>

          {/* Spacing Scale */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Standardized Spacing Scale (8-Point Grid Math)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(spacing).map(([level, val]) => (
                <div
                  key={level}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                >
                  <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-2">
                    <span>Space {level}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{val}</span>
                  </div>
                  <div className="h-3 rounded-sm bg-blue-600/30" style={{ width: val }} />
                </div>
              ))}
            </div>
          </section>

          {/* Border Radius & Elevation */}
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Border Radius & Elevation System
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {Object.entries(radius).map(([name, val]) => (
                <div
                  key={name}
                  className="p-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center shadow-xs"
                  style={{ borderRadius: val }}
                >
                  <span className="text-xs font-bold capitalize text-slate-900 dark:text-white block">
                    {name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{val}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* SECTION 2: BUTTONS */}
      {activeSection === 'buttons' && (
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader
              title="Button Component & Token Variants"
              subtitle="Bound directly to index.css design tokens: primary, secondary, outline, ghost, destructive, soft, success, link"
            />
            <CardBody className="space-y-6">
              {/* Universal Button Component Variants */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Variant Tokens (<code className="text-blue-500 font-mono">variant="..."</code>)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="soft">Soft Token</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="link">Link Button</Button>
                </div>
              </div>

              {/* Sizing Tokens */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Size Tokens (xs: 28px, sm: 32px, md: 40px, lg: 48px)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs">Extra Small (28px)</Button>
                  <Button size="sm">Small (32px)</Button>
                  <Button size="md">Medium (40px)</Button>
                  <Button size="lg">Large (48px)</Button>
                  <Button size="md" isLoading loadingText="Saving...">
                    Loading State
                  </Button>
                  <Button size="md" disabled>
                    Disabled State
                  </Button>
                </div>
              </div>

              {/* Icon & Token Aliases */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Icon Buttons & Token Wrappers
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton size="xs" variant="primary" ariaLabel="Search">
                    <Search className="w-3 h-3" />
                  </IconButton>
                  <IconButton size="sm" variant="secondary" ariaLabel="Search">
                    <Search className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton size="md" variant="ghost" ariaLabel="Search">
                    <Search className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="md" variant="soft" ariaLabel="Search">
                    <Search className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="lg" variant="outline" ariaLabel="Search">
                    <Search className="w-5 h-5" />
                  </IconButton>
                  <OutlineButton size="sm">OutlineButton</OutlineButton>
                  <SoftButton size="sm">SoftButton</SoftButton>
                  <SuccessButton size="sm">SuccessButton</SuccessButton>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card Component Token Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Card Token Variants & Surfaces
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default" padding="sm">
                <CardTitle>Default Surface Card</CardTitle>
                <CardDescription>Mapped to --surface-main & --border-main</CardDescription>
                <CardBody className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  Standard baseline container with subtle elevation and border tokens.
                </CardBody>
                <CardFooter>
                  <span>Token: default</span>
                  <Button size="xs" variant="ghost">Inspect</Button>
                </CardFooter>
              </Card>

              <Card variant="elevated" padding="sm">
                <CardTitle>Elevated Surface Card</CardTitle>
                <CardDescription>Mapped to --surface-elevated & --shadow-medium</CardDescription>
                <CardBody className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  Raised surface token for featured items, hovering cards, or floating sections.
                </CardBody>
                <CardFooter>
                  <span>Token: elevated</span>
                  <Button size="xs" variant="primary">Explore</Button>
                </CardFooter>
              </Card>

              <Card variant="interactive" padding="sm">
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover and press micro-interactions</CardDescription>
                <CardBody className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  Includes border transition, hover shadow elevation, and active scale feedback.
                </CardBody>
                <CardFooter>
                  <span>Token: interactive</span>
                  <span className="text-blue-600 font-semibold text-xs">Clickable →</span>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: INPUTS */}
      {activeSection === 'inputs' && (
        <div className="space-y-6 max-w-2xl">
          <Card padding="md">
            <CardHeader title="Input Controls" subtitle="Fully typed and accessible form elements" />
            <CardBody className="space-y-5">
              <TextInput
                label="Learner Title"
                value={textInputVal}
                onChange={(e) => setTextInputVal(e.target.value)}
                helperText="Displayed across certificates and peer discussion forums."
              />

              <TextInput
                label="Input With Error State"
                defaultValue="invalid_email"
                error="Please enter a valid institution or enterprise email format."
              />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Search Input
                </label>
                <SearchInput
                  value={searchVal}
                  onChange={setSearchVal}
                  placeholder="Type to filter..."
                />
              </div>

              <Select
                label="Course Difficulty"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                options={[
                  { value: 'all', label: 'All Levels' },
                  { value: 'beginner', label: 'Beginner (0-2 years experience)' },
                  { value: 'intermediate', label: 'Intermediate (2-5 years experience)' },
                  { value: 'advanced', label: 'Advanced & Staff-level' },
                ]}
              />

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                  Segmented Control
                </label>
                <SegmentedControl
                  value={segVal}
                  onChange={setSegVal}
                  options={[
                    { value: 'tab1', label: 'Curriculum', count: 12 },
                    { value: 'tab2', label: 'Assessments', count: 4 },
                    { value: 'tab3', label: 'Sandbox' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* SECTION 4: FEEDBACK & PROGRESS */}
      {activeSection === 'feedback' && (
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader title="Badges & Chips" subtitle="Labels, tags, and clickable filters" />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary" dot>
                  Primary
                </Badge>
                <Badge variant="success" dot>
                  Completed
                </Badge>
                <Badge variant="warning" dot>
                  In Review
                </Badge>
                <Badge variant="error" dot>
                  High Latency
                </Badge>
                <Badge variant="info">Information</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Chip selected>Selected Filter</Chip>
                <Chip>Unselected Filter</Chip>
                <Chip onRemove={() => alert('Removed')}>Removable Chip</Chip>
              </div>
            </CardBody>
          </Card>

          <Card padding="md">
            <CardHeader title="Progress Indicators" subtitle="Linear bar and radial progress indicators" />
            <CardBody className="space-y-6">
              <div className="space-y-3">
                <ProgressBar value={68} label="Course Progress" showPercentText size="md" />
                <ProgressBar value={100} label="Completed Module" showPercentText size="sm" variant="success" />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <ProgressRing value={32} max={45} size={72} label="32m" sublabel="goal" />
                <ProgressRing value={100} max={100} size={72} variant="success" label="Done" />
                <ProgressRing value={85} max={100} size={72} variant="warning" label="85%" />
              </div>
            </CardBody>
          </Card>

          <Card padding="md">
            <CardHeader title="Alert Notifications" subtitle="Contextual message banners" />
            <CardBody className="space-y-3">
              <Alert variant="info" title="System Maintenance Notice">
                Platform registry will undergo scheduled cluster maintenance at 03:00 UTC.
              </Alert>
              <Alert variant="success" title="Certificate Verified">
                Your Distributed Systems certificate has been signed and validated.
              </Alert>
              <Alert variant="warning" title="Submission Window Closing">
                Assignment 2 deadline is approaching in 4 hours.
              </Alert>
            </CardBody>
          </Card>
        </div>
      )}

      {/* SECTION 5: OVERLAYS */}
      {activeSection === 'overlays' && (
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader title="Overlay Components" subtitle="Modal, BottomSheet (Mobile-friendly), and Drawer" />
            <CardBody className="flex flex-wrap gap-4">
              <PrimaryButton onClick={() => setIsModalOpen(true)}>
                Open Prototype Modal
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsBottomSheetOpen(true)}>
                Open Mobile BottomSheet
              </SecondaryButton>
              <SecondaryButton onClick={() => setIsDrawerOpen(true)}>
                Open Side Drawer
              </SecondaryButton>
            </CardBody>
          </Card>

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Design System Modal Dialog"
            description="Accessible modal dialog with focus management and backdrop dismiss."
            footer={
              <>
                <SecondaryButton size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton size="sm" onClick={() => setIsModalOpen(false)}>
                  Confirm Action
                </PrimaryButton>
              </>
            }
          >
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This modal component accepts custom body content, structured header titles, and footer action buttons. It locks scroll and dismisses on Escape or outer overlay click.
            </p>
          </Modal>

          {/* BottomSheet */}
          <BottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
            title="Course Actions"
          >
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p>Optimized for mobile touch targets and drawer gestures.</p>
              <PrimaryButton fullWidth onClick={() => setIsBottomSheetOpen(false)}>
                Resume Lesson
              </PrimaryButton>
              <SecondaryButton fullWidth onClick={() => setIsBottomSheetOpen(false)}>
                Download Syllabus PDF
              </SecondaryButton>
            </div>
          </BottomSheet>

          {/* Drawer */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Contextual Sidebar Drawer"
          >
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <p>Useful for filter panels, lesson notes, and interactive grading rubrics.</p>
              <SecondaryButton fullWidth onClick={() => setIsDrawerOpen(false)}>
                Close Drawer
              </SecondaryButton>
            </div>
          </Drawer>
        </div>
      )}
    </div>
  );
};
