'use client';

import { Settings, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAdGeneratorStore } from '@/lib/store';

export function BrandSettings() {
  const { project, setProjectName, setBrand } = useAdGeneratorStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Brand Settings</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure your brand identity for the advertisement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Project Name</label>
            <Input
              value={project.name}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Brand Name</label>
            <Input
              value={project.brand.name}
              onChange={(e) => setBrand({ name: e.target.value })}
              placeholder="e.g., Chanel"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Tagline</label>
            <Input
              value={project.brand.tagline}
              onChange={(e) => setBrand({ tagline: e.target.value })}
              placeholder="e.g., Timeless Elegance"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Palette className="w-3 h-3" /> Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={project.brand.primaryColor}
                  onChange={(e) => setBrand({ primaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={project.brand.primaryColor}
                  onChange={(e) => setBrand({ primaryColor: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Palette className="w-3 h-3" /> Secondary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={project.brand.secondaryColor}
                  onChange={(e) => setBrand({ secondaryColor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={project.brand.secondaryColor}
                  onChange={(e) => setBrand({ secondaryColor: e.target.value })}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
