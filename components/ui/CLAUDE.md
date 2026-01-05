# Available UI Components

This file contains information about all available shadcn/ui components in the sandbox. **CRITICAL**: Always use these pre-built components instead of creating new ones.

## Import Pattern
All components use the same import pattern:
```typescript
import { ComponentName } from "@/components/ui/component-name"
```

## Available Components

### Button
**File**: `button.tsx`
**Import**: `import { Button } from "@/components/ui/button"`
**Usage**: 
```tsx
<Button variant="default" size="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```
**Variants**: default, destructive, outline, secondary, ghost, link
**Sizes**: default, sm, lg, icon

### Card
**File**: `card.tsx`
**Import**: `import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card"`
**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <p>Card footer</p>
  </CardFooter>
</Card>
```

### Input
**File**: `input.tsx`
**Import**: `import { Input } from "@/components/ui/input"`
**Usage**:
```tsx
<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
```

### Label
**File**: `label.tsx`
**Import**: `import { Label } from "@/components/ui/label"`
**Usage**:
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Textarea
**File**: `textarea.tsx`
**Import**: `import { Textarea } from "@/components/ui/textarea"`
**Usage**:
```tsx
<Textarea placeholder="Type your message here." />
<Textarea rows={4} placeholder="Longer message..." />
```

### Select
**File**: `select.tsx`
**Import**: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"`
**Usage**:
```tsx
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

### Switch
**File**: `switch.tsx`
**Import**: `import { Switch } from "@/components/ui/switch"`
**Usage**:
```tsx
<Switch />
<Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
```

### Badge
**File**: `badge.tsx`
**Import**: `import { Badge } from "@/components/ui/badge"`
**Usage**:
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```
**Variants**: default, secondary, destructive, outline

### Dialog
**File**: `dialog.tsx`
**Import**: `import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"`
**Usage**:
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs
**File**: `tabs.tsx`
**Import**: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"`
**Usage**:
```tsx
<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Make changes to your account here.</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Change your password here.</p>
  </TabsContent>
</Tabs>
```

### Tooltip
**File**: `tooltip.tsx`
**Import**: `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"`
**Usage**:
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Add to library</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Separator
**File**: `separator.tsx`
**Import**: `import { Separator } from "@/components/ui/separator"`
**Usage**:
```tsx
<Separator />
<Separator orientation="vertical" />
```

### Skeleton
**File**: `skeleton.tsx`
**Import**: `import { Skeleton } from "@/components/ui/skeleton"`
**Usage**:
```tsx
<Skeleton className="w-[100px] h-[20px] rounded-full" />
<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[200px]" />
```

## Utility Functions

### cn() Function
**Import**: `import { cn } from "@/lib/utils"`
**Usage**: For className merging with Tailwind CSS
```tsx
<div className={cn("base-class", conditionalClass && "conditional-class", className)} />
```

## Adding New Components

If you need to add a new UI component:

1. **Create the component file** in `components/ui/`
2. **Update this file** (`ui-components.md`) with:
   - Component name and file
   - Import statement
   - Usage examples
   - Available variants/props
3. **Follow shadcn/ui patterns** for consistency

## Important Notes

- **NEVER create duplicate components** - always check this file first
- **Use TypeScript** for all component props
- **Follow Tailwind CSS** for styling
- **Include accessibility** attributes (aria-*, role, etc.)
- **Support dark mode** using Tailwind's dark: prefix
