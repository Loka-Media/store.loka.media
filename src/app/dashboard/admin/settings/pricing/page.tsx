'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalMarkup } from '@/contexts/GlobalMarkupContext';
import { Slider } from '@mui/material';
import { Percent, ShieldAlert, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const MARKUP_PRESETS = [0, 10, 20, 30, 35, 40, 50, 75, 100];

const sliderSx = {
  color: 'var(--primary)',
  height: 8,
  '& .MuiSlider-track': {
    border: 'none',
    background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
  },
  '& .MuiSlider-thumb': {
    height: 22,
    width: 22,
    backgroundColor: '#fff',
    border: '2px solid var(--primary)',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: 'inherit',
    },
    '&::before': { display: 'none' },
  },
  '& .MuiSlider-rail': {
    opacity: 0.28,
    backgroundColor: '#d8d8d8',
  },
};

export default function AdminPricingSettings() {
  const {
    globalMarkup,
    categoryMarkup,
    updatePricingSettings,
    loading: contextLoading,
  } = useGlobalMarkup();

  const [sliderValue, setSliderValue] = useState<number>(35);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySliderValues, setCategorySliderValues] = useState<Record<string, number>>({});
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);

  // Fetch dynamic categories and align with DB markups
  useEffect(() => {
    async function loadPricingData() {
      try {
        console.log('[PricingPage] Fetching categories and markups from API...');
        const res = await fetch('/api/admin/settings/pricing');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.categories) {
            setCategories(data.categories);

            const initialSliders: Record<string, number> = {};
            data.categories.forEach((cat: string) => {
              const savedVal =
                data.categoryMarkup[cat] !== undefined
                  ? data.categoryMarkup[cat]
                  : data.categoryMarkup[cat.toLowerCase()] !== undefined
                    ? data.categoryMarkup[cat.toLowerCase()]
                    : 0;
              initialSliders[cat] = savedVal;
              console.log(`[PricingPage] Loaded ${cat}: ${savedVal}`);
            });

            console.log(`[PricingPage] Loaded Global Markup: ${data.globalMarkup}`);
            console.log('[PricingPage] DB Load Status: success');
            setCategorySliderValues(initialSliders);
          }
        } else {
          console.warn('[PricingPage] DB Load Status: failed —', res.status, res.statusText);
        }
      } catch (err) {
        console.error('[PricingPage] DB Load Status: error —', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadPricingData();
  }, [categoryMarkup]);

  // Sync global slider with context value
  useEffect(() => {
    if (!contextLoading) {
      setSliderValue(globalMarkup);
    }
  }, [globalMarkup, contextLoading]);

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setSliderValue(newValue as number);
  };

  const handlePresetClick = (preset: number) => setSliderValue(preset);

  const handleCategorySliderChange = (category: string, newValue: number) => {
    setCategorySliderValues((prev) => ({ ...prev, [category]: newValue }));
  };

  const handleCategoryPresetClick = (category: string, preset: number) => {
    setCategorySliderValues((prev) => ({ ...prev, [category]: preset }));
  };

  const isCategoryMarkupChanged = () =>
    Object.keys(categorySliderValues).some((cat) => {
      const savedVal =
        categoryMarkup[cat] !== undefined
          ? categoryMarkup[cat]
          : categoryMarkup[cat.toLowerCase()] !== undefined
            ? categoryMarkup[cat.toLowerCase()]
            : 0;
      return categorySliderValues[cat] !== savedVal;
    });

  const isSaveDisabled =
    saving ||
    contextLoading ||
    loadingCategories ||
    (sliderValue === globalMarkup && !isCategoryMarkupChanged());

  const handleSave = async () => {
    setSaving(true);
    console.log('[PricingPage] Saving → Global:', sliderValue, '| Categories:', categorySliderValues);
    const success = await updatePricingSettings(sliderValue, categorySliderValues);
    console.log('[PricingPage] Save result:', success ? 'Saved Successfully' : 'Save Failed');
    setSaving(false);
  };


  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mt-16 mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-8 mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Global Pricing Settings
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400 font-medium max-w-xl">
              Manage platform-wide markup settings dynamically. Updates apply to all storefront listings, creator tools, and checkout flows instantly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
          {/* ── Controls ── */}
          <div className="space-y-8">

            {/* Global Platform Markup Card */}
            <div className="relative p-6 bg-gradient-to-br from-gray-950 to-gray-900 rounded-3xl border border-white/8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Percent className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Global Platform Markup</h2>
                  <p className="text-xs text-gray-400">Applied to all products unless overridden by a category rule.</p>
                </div>
              </div>

              <div className="space-y-5 py-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-400">Current Value</span>
                  <span className="text-5xl font-extrabold text-primary tabular-nums">
                    {sliderValue}%
                  </span>
                </div>

                <div className="px-1">
                  <Slider
                    value={sliderValue}
                    min={0}
                    max={100}
                    step={1}
                    onChange={handleSliderChange}
                    sx={sliderSx}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Quick Presets</span>
                  <div className="flex flex-wrap gap-2">
                    {MARKUP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetClick(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${sliderValue === preset
                            ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(5,223,114,0.4)]'
                            : 'bg-gray-900 text-gray-300 border-white/10 hover:border-primary/30 hover:text-primary'
                          }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Markups Section Header */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Category Markups</h2>
                <p className="text-xs text-gray-400">Override the global markup per category. Synced dynamically from catalog.</p>
              </div>
            </div>

            {/* Category Cards Grid — no fixed height, full page scroll via Lenis */}
            {loadingCategories ? (
              <div className="py-16 flex flex-col justify-center items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
                <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Loading categories…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const currentVal = categorySliderValues[category] ?? 0;
                  const isChanged =
                    (categoryMarkup[category] ?? categoryMarkup[category.toLowerCase()] ?? 0) !== currentVal;

                  return (
                    <div
                      key={category}
                      className="relative p-5 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl border border-white/8 shadow-xl overflow-hidden transition-all hover:border-primary/20 group"
                    >
                      {/* Subtle glow on hover */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/0 group-hover:bg-primary/5 rounded-full blur-2xl pointer-events-none transition-all duration-500" />

                      {/* Category name + value */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          {isChanged && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm font-bold text-white">{category}</span>
                        </div>
                        <span className="text-2xl font-extrabold text-primary tabular-nums leading-none">
                          {currentVal}%
                        </span>
                      </div>

                      {/* Slider */}
                      <div className="px-1 mb-3">
                        <Slider
                          value={currentVal}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(_e, val) => handleCategorySliderChange(category, val as number)}
                          sx={sliderSx}
                        />
                      </div>

                      {/* Preset buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {MARKUP_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            onClick={() => handleCategoryPresetClick(category, preset)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${currentVal === preset
                                ? 'bg-primary text-black border-primary shadow-[0_0_8px_rgba(5,223,114,0.35)]'
                                : 'bg-gray-900 text-gray-400 border-white/5 hover:border-primary/25 hover:text-gray-200'
                              }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="px-10 py-4 h-12 text-sm font-extrabold bg-primary hover:bg-primary-hover text-black rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                {saving ? 'Saving Changes…' : 'Apply Markup Configuration'}
              </Button>
            </div>

            {/* Warning Banner */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-primary">Critical Pricing Policy Note</h4>
                <p className="text-xs text-gray-300 leading-relaxed mt-1">
                  Adjusting the platform markup instantly affects checkout calculations and storefront product pricing globally. Because pricing is determined dynamically, no background product database updates are triggered, preserving database efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacer so last card isn't flush with viewport edge */}
        <div className="h-16" />
      </div>
    </div>
  );
}
