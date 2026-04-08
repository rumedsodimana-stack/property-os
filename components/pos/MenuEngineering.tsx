import React, { useState, useMemo, useEffect } from 'react';
import { MasterInventoryItem, RecipeDraft, Ingredient, MenuItem } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { addItem, updateItem, subscribeToItems } from '../../services/kernel/firestoreService';
import {
    Search, Plus, Save, ChevronRight, Calculator, AlertCircle, ChefHat, Check,
    Beaker, FlaskConical, Sparkles, TrendingUp, DollarSign, Clock, Users,
    Leaf, Flame, Wheat, AlertTriangle, Camera, FileText, GitBranch,
    ThumbsUp, ThumbsDown, MessageSquare, History, Target, Star, Award,
    Thermometer, Scale, Timer, Copy, ArrowRight, Eye, Edit, Trash2,
    CheckCircle, XCircle, PieChart, BarChart3, RefreshCw, Zap
} from 'lucide-react';
import { botEngine } from '../../services/kernel/systemBridge';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';

interface MenuEngineeringProps {
    onBack: () => void;
}

interface TestBatch {
    id: string;
    recipeId: string;
    name: string;
    date: number;
    result: string;
    score: number;
    tester: string;
    notes: string;
}

interface RecipeVersion {
    id: string;
    version: string;
    date: number;
    author: string;
    changes: string;
}

// Allergen icons mapping
const ALLERGEN_ICONS: Record<string, { icon: any; color: string }> = {
    'Gluten': { icon: Wheat, color: 'text-amber-500' },
    'Dairy': { icon: FlaskConical, color: 'text-blue-500' },
    'Nuts': { icon: AlertTriangle, color: 'text-orange-500' },
    'Shellfish': { icon: Flame, color: 'text-red-500' },
    'Soy': { icon: Leaf, color: 'text-emerald-500' },
    'Egg': { icon: Target, color: 'text-yellow-500' },
};

const MenuEngineering: React.FC<MenuEngineeringProps> = ({ onBack }) => {
    const { inventory: MASTER_INVENTORY, recipeDrafts: RECIPE_DRAFTS, menuItems: MENU_ITEMS, outlets: OUTLETS } = usePms();
    const [activeTab, setActiveTab] = useState<'Catalog' | 'Create' | 'Approval' | 'Testing' | 'Analytics'>('Catalog');
    const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showRecipeDetail, setShowRecipeDetail] = useState<MenuItem | null>(null);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [taxRate, setTaxRate] = useState(5);
    const [serviceCharge, setServiceCharge] = useState(10);
    const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
    const [testBatches, setTestBatches] = useState<TestBatch[]>([]);
    const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
    const [loading, setLoading] = useState(true);

    const menuDimensions: ReportDimension[] = [
        { key: 'category', label: 'Dish Category' },
        { key: 'department', label: 'Department' },
        { key: 'isHalal', label: 'Dietary Compliance' }
    ];

    const menuMetrics: ReportMetric[] = [
        { key: 'price', label: 'Average Price', aggregation: 'avg', format: (v) => `$${v.toFixed(2)}` },
        { key: 'foodCost', label: 'Average Food Cost', aggregation: 'avg', format: (v) => `$${v.toFixed(2)}` },
        { key: 'id', label: 'Recipe Count', aggregation: 'count' }
    ];

    useEffect(() => {
        const unsubBatches = subscribeToItems<TestBatch>('test_batches', (data) => {
            setTestBatches(data);
        });
        const unsubVersions = subscribeToItems<RecipeVersion>('recipe_versions', (data) => {
            setRecipeVersions(data);
            setLoading(false);
        });
        return () => {
            unsubBatches();
            unsubVersions();
        };
    }, []);

    // Handler functions for Edit/View/Clone
    const handleViewRecipe = (item: MenuItem) => {
        setShowRecipeDetail(item);
    };

    const handleEditRecipe = (item: MenuItem) => {
        setNewRecipe({
            name: item.name,
            category: item.category,
            ingredients: [],
            totalCost: item.price * 0.3,
            laborCost: 2.5,
            overheadCost: 1.0,
            suggestedPrice: item.price,
            projectedMargin: 70,
            complianceFlags: { halal: item.isHalal },
            aiSuggestions: []
        });
        setSelectedAllergens(item.allergens || []);
        setDietaryTags(item.isHalal ? ['Halal'] : []);
        setActiveTab('Create');
        botEngine.logActivity('POS', 'Recipe_Edit_Started', `Editing: ${item.name}`, 'Chef_Station');
    };

    const handleCloneRecipe = (item: MenuItem) => {
        setNewRecipe({
            name: `Copy of ${item.name}`,
            category: item.category,
            ingredients: [],
            totalCost: item.price * 0.3,
            laborCost: 2.5,
            overheadCost: 1.0,
            suggestedPrice: item.price,
            projectedMargin: 70,
            complianceFlags: { halal: item.isHalal },
            aiSuggestions: []
        });
        setSelectedAllergens(item.allergens || []);
        setDietaryTags(item.isHalal ? ['Halal'] : []);
        setActiveTab('Create');
        botEngine.logActivity('POS', 'Recipe_Cloned', `Cloned: ${item.name}`, 'Chef_Station');
    };

    // Recipe creation state
    const [newRecipe, setNewRecipe] = useState<Partial<RecipeDraft>>({
        name: '',
        category: 'Main',
        ingredients: [],
        totalCost: 0,
        laborCost: 2.5,
        overheadCost: 1.0,
        suggestedPrice: 0,
        projectedMargin: 0,
        complianceFlags: { halal: true },
        aiSuggestions: []
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [targetMargin, setTargetMargin] = useState(70);
    const [wasteFactor, setWasteFactor] = useState(5);
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [dietaryTags, setDietaryTags] = useState<string[]>(['Halal']);
    const [prepNotes, setPrepNotes] = useState('');
    const [platingNotes, setPlatingNotes] = useState('');
    const [prepTime, setPrepTime] = useState(15);
    const [cookTime, setCookTime] = useState(25);
    const [servingSize, setServingSize] = useState(1);
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

    // Calculate costs with waste factor
    const calculateCosts = (ingredients: any[], labor: number, overhead: number, waste: number) => {
        const rawCost = ingredients.reduce((acc, i) => acc + i.costImpact, 0);
        const wasteAdjusted = rawCost * (1 + waste / 100);
        const total = wasteAdjusted + labor + overhead;
        return { rawCost, wasteAdjusted, total };
    };

    const costs = useMemo(() => {
        return calculateCosts(
            newRecipe.ingredients || [],
            newRecipe.laborCost || 0,
            newRecipe.overheadCost || 0,
            wasteFactor
        );
    }, [newRecipe.ingredients, newRecipe.laborCost, newRecipe.overheadCost, wasteFactor]);

    const suggestedPrice = useMemo(() => {
        return costs.total / ((100 - targetMargin) / 100);
    }, [costs.total, targetMargin]);

    const projectedProfit = suggestedPrice - costs.total;
    const actualMargin = suggestedPrice > 0 ? ((projectedProfit / suggestedPrice) * 100) : 0;

    // Nutritional estimates (mock calculation)
    const nutritionEstimate = useMemo(() => ({
        calories: (newRecipe.ingredients?.length || 0) * 85 + 120,
        protein: (newRecipe.ingredients?.length || 0) * 8,
        carbs: (newRecipe.ingredients?.length || 0) * 12,
        fat: (newRecipe.ingredients?.length || 0) * 6,
    }), [newRecipe.ingredients]);

    const handleAddIngredient = (item: MasterInventoryItem) => {
        const exists = newRecipe.ingredients?.some(i => i.ingredientId === item.id);

        if (exists) {
            setNewRecipe(prev => ({
                ...prev,
                ingredients: prev.ingredients?.filter(i => i.ingredientId !== item.id)
            }));
            return;
        }

        const newIng = {
            ingredientId: item.id,
            qty: 1,
            unit: item.unit,
            costImpact: item.costPerUnit
        };

        setNewRecipe(prev => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), newIng]
        }));
    };

    const updateIngredientQty = (idx: number, qty: number) => {
        setNewRecipe(prev => {
            const ingredients = [...(prev.ingredients || [])];
            const item = MASTER_INVENTORY.find(m => m.id === ingredients[idx].ingredientId);
            if (!item) return prev;

            ingredients[idx] = { ...ingredients[idx], qty, costImpact: item.costPerUnit * qty };
            return { ...prev, ingredients };
        });
    };

    const removeIngredient = (idx: number) => {
        setNewRecipe(prev => ({
            ...prev,
            ingredients: prev.ingredients?.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = async () => {
        if (!newRecipe.name || (newRecipe.ingredients?.length || 0) === 0) return;
        try {
            const draft: Omit<RecipeDraft, 'id'> = {
                name: newRecipe.name!,
                version: 1,
                createdBy: 'Chef Station',
                createdAt: Date.now(),
                category: newRecipe.category || 'Main',
                status: 'Pending Approval',
                ingredients: newRecipe.ingredients || [],
                totalCost: costs.total,
                laborCost: newRecipe.laborCost || 0,
                overheadCost: newRecipe.overheadCost || 0,
                suggestedPrice: suggestedPrice,
                projectedMargin: actualMargin,
                complianceFlags: { halal: dietaryTags.includes('Halal') },
                aiSuggestions: aiSuggestions.map(s => s.text),
                outletIds: selectedOutlets,
                allergens: selectedAllergens,
                dietaryTags,
                prepTime,
                cookTime,
            };
            await addItem('recipeDrafts', draft);
            botEngine.logActivity('POS', 'Recipe_Draft_Submitted', `New Dish: ${newRecipe.name} | Cost: $${costs.total.toFixed(2)} | Target: $${suggestedPrice.toFixed(2)}`, 'Chef_Station');
            // Reset form
            setNewRecipe({ name: '', category: 'Main', ingredients: [], totalCost: 0, laborCost: 2.5, overheadCost: 1.0, suggestedPrice: 0, projectedMargin: 0, complianceFlags: { halal: true }, aiSuggestions: [] });
            setSelectedAllergens([]);
            setDietaryTags(['Halal']);
            setSelectedOutlets([]);
            setActiveTab('Catalog');
            alert(`"${draft.name}" submitted for approval!`);
        } catch (err) {
            console.error('Failed to submit recipe draft:', err);
            alert('Submission failed. Please try again.');
        }
    };

    const toggleAllergen = (allergen: string) => {
        setSelectedAllergens(prev =>
            prev.includes(allergen)
                ? prev.filter(a => a !== allergen)
                : [...prev, allergen]
        );
    };

    const toggleDietaryTag = (tag: string) => {
        setDietaryTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // AI Suggestions based on recipe
    const aiSuggestions = useMemo(() => {
        const suggestions = [];
        if ((newRecipe.ingredients?.length || 0) > 0) {
            if (costs.total > 10) {
                suggestions.push({ type: 'cost', text: 'Consider substituting premium ingredients to reduce CoGS' });
            }
            if (targetMargin < 65) {
                suggestions.push({ type: 'margin', text: 'Target margin is below industry standard (65-70%)' });
            }
            if (prepTime + cookTime > 45) {
                suggestions.push({ type: 'time', text: 'Long prep time may affect service speed during peak hours' });
            }
            suggestions.push({ type: 'pairing', text: 'AI recommends pairing with house white wine for upselling' });
        }
        return suggestions;
    }, [newRecipe.ingredients, costs.total, targetMargin, prepTime, cookTime]);

    return (
        <div className="h-full flex flex-col bg-zinc-950/50">
            {/* Header */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl shadow-lg shadow-rose-900/20">
                        <FlaskConical className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-light text-white leading-tight">Culinary <span className="font-bold text-rose-500">R&D Lab</span></h2>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none">Recipe Development • Costing</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                        {[
                            { id: 'Catalog', icon: <ChefHat className="w-3.5 h-3.5" />, label: 'Recipe Catalog' },
                            { id: 'Create', icon: <Beaker className="w-3.5 h-3.5" />, label: 'Create New' },
                            { id: 'Approval', icon: <ThumbsUp className="w-3.5 h-3.5" />, label: 'Approval Queue' },
                            { id: 'Testing', icon: <FlaskConical className="w-3.5 h-3.5" />, label: 'Test Batches' },
                            { id: 'Analytics', icon: <PieChart className="w-3.5 h-3.5" />, label: 'Analytics' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                    ? tab.id === 'Create' ? 'bg-rose-600 text-white shadow-lg' : tab.id === 'Approval' ? 'bg-amber-600 text-white shadow-lg' : 'bg-zinc-800 text-white shadow-lg'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                                {tab.id === 'Approval' && RECIPE_DRAFTS.filter(d => d.status === 'Pending Approval').length > 0 && (
                                    <span className="ml-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {RECIPE_DRAFTS.filter(d => d.status === 'Pending Approval').length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recipe Catalog Tab */}
            {activeTab === 'Catalog' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Stats Bar */}
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                        <div className="grid grid-cols-5 gap-6">
                            {[
                                { label: 'Active Recipes', value: MENU_ITEMS.length, icon: <ChefHat className="w-4 h-4" />, color: 'text-violet-500' },
                                { label: 'Pending Approval', value: RECIPE_DRAFTS.filter(d => d.status === 'Pending Approval').length, icon: <Clock className="w-4 h-4" />, color: 'text-amber-500' },
                                { label: 'Avg Food Cost', value: '28.5%', icon: <DollarSign className="w-4 h-4" />, color: 'text-emerald-500' },
                                { label: 'Test Batches', value: testBatches.length, icon: <FlaskConical className="w-4 h-4" />, color: 'text-cyan-500' },
                                { label: 'Avg Rating', value: '4.7★', icon: <Star className="w-4 h-4" />, color: 'text-amber-400' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={stat.color}>{stat.icon}</div>
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{stat.label}</span>
                                    </div>
                                    <div className="text-2xl font-light text-white">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Catalog Grid */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {MENU_ITEMS.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedRecipe(item.id)}
                                    className={`bg-zinc-900/50 border rounded-2xl p-5 hover:border-rose-500/30 transition-all cursor-pointer group ${selectedRecipe === item.id ? 'border-rose-500 bg-rose-500/5' : 'border-zinc-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-serif text-xl text-zinc-400 group-hover:text-rose-400 transition shadow-inner">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${item.isHalal ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {item.isHalal ? '✓ Halal' : item.category}
                                            </span>
                                            {item.isVegan && (
                                                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-green-500/10 text-green-500">Vegan</span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-zinc-200 font-medium mb-1 group-hover:text-white transition">{item.name}</h3>

                                    {/* Allergen Tags */}
                                    {(item.allergens || []).length > 0 && (
                                        <div className="flex gap-1 mt-2 mb-3">
                                            {(item.allergens || []).slice(0, 3).map(a => (
                                                <span key={a} className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">{a}</span>
                                            ))}
                                            {(item.allergens || []).length > 3 && (
                                                <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">+{(item.allergens || []).length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-800/50">
                                        <div>
                                            <div className="text-[9px] text-zinc-600 uppercase mb-0.5">Est. Cost</div>
                                            <div className="text-sm font-mono text-rose-400">${(item.price * 0.3).toFixed(2)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] text-zinc-600 uppercase mb-0.5">Selling</div>
                                            <div className="text-lg font-mono text-white">${item.price.toFixed(2)}</div>
                                        </div>
                                    </div>

                                    {/* Quick Actions on Hover */}
                                    <div className="mt-4 pt-3 border-t border-zinc-800/30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleViewRecipe(item); }}
                                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition flex items-center justify-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" /> View
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCloneRecipe(item); }}
                                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold uppercase text-zinc-400 hover:text-white transition flex items-center justify-center gap-1"
                                        >
                                            <Copy className="w-3 h-3" /> Clone
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditRecipe(item); }}
                                            className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600 rounded-lg text-[10px] font-bold uppercase text-rose-400 hover:text-white transition flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Recipe Tab */}
            {activeTab === 'Create' && (
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Left: Inventory Picker */}
                    <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/30">
                        <div className="p-4 border-b border-zinc-800">
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setShowSelectedOnly(false)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition ${!showSelectedOnly ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setShowSelectedOnly(true)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition ${showSelectedOnly ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    Selected ({newRecipe.ingredients?.length || 0})
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Search Ingredients..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-rose-500/50 focus:ring-0 placeholder:text-zinc-700"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-1">
                            {MASTER_INVENTORY
                                .filter(i => showSelectedOnly ? newRecipe.ingredients?.some(sel => sel.ingredientId === i.id) : true)
                                .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAddIngredient(item)}
                                        className={`w-full flex justify-between items-center p-3 rounded-xl border transition text-left ${newRecipe.ingredients?.some(i => i.ingredientId === item.id)
                                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                            : 'bg-zinc-900/50 border-zinc-800/50 hover:border-rose-500/30 text-zinc-300 hover:text-white'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{item.name}</div>
                                            <div className="text-[10px] text-zinc-600"><span className="font-mono text-zinc-500 font-bold mr-1">{item.sku}</span> • {item.unit} • ${item.costPerUnit}</div>
                                        </div>
                                        {newRecipe.ingredients?.some(i => i.ingredientId === item.id) ? (
                                            <Check className="w-4 h-4 text-rose-500" />
                                        ) : (
                                            <Plus className="w-4 h-4 text-zinc-600" />
                                        )}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Center: Recipe Builder */}
                    <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {/* Basic Info */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Recipe Name</label>
                                    <input
                                        type="text"
                                        value={newRecipe.name}
                                        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xl text-white focus:border-rose-500/50 focus:ring-0"
                                        placeholder="e.g. Truffle Risotto alla Milanese"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Category</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-0"
                                        value={newRecipe.category}
                                        onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                                    >
                                        {['Starter', 'Main', 'Dessert', 'Beverage', 'Side', 'Soup', 'Salad'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Outlet Availability */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Outlet Availability</label>
                                <div className="flex flex-wrap gap-2">
                                    {OUTLETS.map(outlet => (
                                        <button
                                            key={outlet.id}
                                            onClick={() => setSelectedOutlets(prev => prev.includes(outlet.id) ? prev.filter(id => id !== outlet.id) : [...prev, outlet.id])}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${selectedOutlets.includes(outlet.id) ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {outlet.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Timing & Difficulty */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Timer className="w-4 h-4 text-cyan-500" />
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Prep Time</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={prepTime}
                                            onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-center"
                                        />
                                        <span className="text-zinc-500 text-sm">min</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Cook Time</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={cookTime}
                                            onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-center"
                                        />
                                        <span className="text-zinc-500 text-sm">min</span>
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-violet-500" />
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Servings</label>
                                    </div>
                                    <input
                                        type="number"
                                        value={servingSize}
                                        onChange={(e) => setServingSize(parseInt(e.target.value) || 1)}
                                        className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white text-center"
                                    />
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Difficulty</label>
                                    </div>
                                    <div className="flex gap-1">
                                        {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setDifficulty(d)}
                                                className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition ${difficulty === d
                                                    ? d === 'Easy' ? 'bg-emerald-600 text-white' : d === 'Medium' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                                                    : 'bg-zinc-800 text-zinc-500'
                                                    }`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dietary Tags */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Dietary Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Halal', 'Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Organic'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleDietaryTag(tag)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border transition ${dietaryTags.includes(tag)
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                        >
                                            {dietaryTags.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Allergens */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Contains Allergens
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(ALLERGEN_ICONS).map(([allergen, { icon: Icon, color }]) => (
                                        <button
                                            key={allergen}
                                            onClick={() => toggleAllergen(allergen)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition flex items-center gap-1.5 ${selectedAllergens.includes(allergen)
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${selectedAllergens.includes(allergen) ? 'text-rose-400' : color}`} />
                                            {allergen}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ingredients Table */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recipe Ingredients</h3>
                                    <span className="text-xs text-zinc-600">{newRecipe.ingredients?.length || 0} items • Waste Factor: {wasteFactor}%</span>
                                </div>

                                <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 overflow-hidden">
                                    {/* Header */}
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-zinc-900/50 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                        <div className="col-span-4">Ingredient</div>
                                        <div className="col-span-3 text-center">Quantity</div>
                                        <div className="col-span-2 text-center">Unit</div>
                                        <div className="col-span-2 text-right">Cost</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {/* Rows */}
                                    {newRecipe.ingredients?.map((ing, idx) => {
                                        const masterItem = MASTER_INVENTORY.find(m => m.id === ing.ingredientId);
                                        return (
                                            <div key={ing.ingredientId} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-zinc-800/50 hover:bg-zinc-900/30 transition">
                                                <div className="col-span-4">
                                                    <div className="text-sm font-medium text-zinc-200 truncate">{masterItem?.name}</div>
                                                    <div className="text-[10px] text-zinc-600">SKU: {masterItem?.sku}</div>
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={ing.qty}
                                                        onChange={(e) => updateIngredientQty(idx, parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-center text-sm font-mono text-white focus:border-rose-500/50"
                                                    />
                                                </div>
                                                <div className="col-span-2 text-center text-sm text-zinc-400">{ing.unit}</div>
                                                <div className="col-span-2 text-right font-mono text-rose-400">${ing.costImpact.toFixed(2)}</div>
                                                <div className="col-span-1 text-right">
                                                    <button
                                                        onClick={() => removeIngredient(idx)}
                                                        className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!newRecipe.ingredients || newRecipe.ingredients.length === 0) && (
                                        <div className="p-12 text-center text-zinc-600">
                                            <Beaker className="w-10 h-10 mx-auto mb-4 opacity-30" />
                                            <p className="text-sm">Add ingredients from the picker on the left</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prep & Plating Notes */}
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Preparation Notes</label>
                                    <textarea
                                        value={prepNotes}
                                        onChange={(e) => setPrepNotes(e.target.value)}
                                        placeholder="Enter mise en place, technique notes..."
                                        className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 focus:ring-0 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Plating & Presentation</label>
                                    <textarea
                                        value={platingNotes}
                                        onChange={(e) => setPlatingNotes(e.target.value)}
                                        placeholder="Describe plating style, garnish, presentation..."
                                        className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500/50 focus:ring-0 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Cost Controller & AI - keeping existing content... */}

                    {/* ... (Cost Controller & AI content is already there, no need to replace unless I must to reach end of file for the Modal fix) ... */}
                    {/* Since I cannot select non-contiguous blocks easily without rewriting the whole file or multiple blocks, and I need to fix the JSX structure at the END of the file, I should do the JSX fix in a separate chunk or do a big replace. */}
                    {/* Actually, I will just fix the column spans here, and then fix the JSX structure at the end of the file in the same call or next. */}
                    {/* Wait, I can't leave the file broken. I MUST fix the syntax error now. */}





                    {/* Right: Cost Controller & AI */}
                    <div className="w-96 border-l border-zinc-800 flex flex-col bg-zinc-900/30 overflow-y-auto custom-scrollbar">
                        {/* Ingredient Breakdown */}
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/10">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-zinc-400" /> Ingredient Costs
                            </h3>
                            {newRecipe.ingredients && newRecipe.ingredients.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {newRecipe.ingredients.map((ing, idx) => {
                                        const masterItem = MASTER_INVENTORY.find(m => m.id === ing.ingredientId);
                                        return (
                                            <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-800/30 pb-1 last:border-0">
                                                <div className="flex-1 truncate pr-2 text-zinc-300">
                                                    {masterItem?.name}
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={ing.qty}
                                                        onChange={(e) => updateIngredientQty(idx, parseFloat(e.target.value) || 0)}
                                                        className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-right text-xs font-mono text-white focus:border-rose-500/50 outline-none transition-colors hover:border-zinc-700"
                                                    />
                                                    <span className="text-zinc-500 font-mono text-[10px] w-8">{ing.unit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-600 italic text-center py-2">No ingredients added</div>
                            )}
                        </div>

                        {/* Cost Summary */}
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-rose-500" /> Cost Analysis
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Raw Ingredients</span>
                                    <span className="text-zinc-300 font-mono">${costs.rawCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-zinc-500">Waste Factor</span>
                                        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded px-1">
                                            <input
                                                type="number"
                                                value={wasteFactor}
                                                onChange={(e) => setWasteFactor(Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-8 bg-transparent text-right text-xs font-mono text-white outline-none"
                                            />
                                            <span className="text-zinc-500 text-[10px] ml-0.5">%</span>
                                        </div>
                                    </div>
                                    <span className="text-amber-400 font-mono text-xs">+${(costs.wasteAdjusted - costs.rawCost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-zinc-500">Labor Cost</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-zinc-500 text-xs">$</span>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={newRecipe.laborCost}
                                            onChange={(e) => setNewRecipe({ ...newRecipe, laborCost: parseFloat(e.target.value) || 0 })}
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-right text-xs font-mono text-white focus:border-rose-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-zinc-500">Overhead</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-zinc-500 text-xs">$</span>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={newRecipe.overheadCost}
                                            onChange={(e) => setNewRecipe({ ...newRecipe, overheadCost: parseFloat(e.target.value) || 0 })}
                                            className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-right text-xs font-mono text-white focus:border-rose-500/50 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-zinc-800 pt-3 flex justify-between">
                                    <span className="text-zinc-300 font-bold">Total Cost</span>
                                    <span className="text-rose-500 font-mono text-lg">${costs.total.toFixed(2)}</span>
                                </div>
                            </div>

                        </div>



                        {/* Pricing */}
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-500" /> Pricing Target
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Target Margin %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={targetMargin}
                                        onChange={(e) => setTargetMargin(Math.min(99, Math.max(0, parseFloat(e.target.value) || 0)))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white focus:border-emerald-500/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Cost Factor %</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={(100 - targetMargin).toFixed(1)}
                                        onChange={(e) => setTargetMargin(100 - (parseFloat(e.target.value) || 0))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-400 focus:border-emerald-500/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                                {/* Tax & Service */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Govt Tax (%)</label>
                                        <input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Service Chg (%)</label>
                                        <input type="number" value={serviceCharge} onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-500">Base Price</span>
                                            <span className="text-zinc-300">${suggestedPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-500">Tax ({taxRate}%)</span>
                                            <span className="text-zinc-400 font-mono">+${(suggestedPrice * taxRate / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-500">Service ({serviceCharge}%)</span>
                                            <span className="text-zinc-400 font-mono">+${(suggestedPrice * serviceCharge / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-zinc-800 pt-2 flex justify-between items-end mt-2">
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Final Price</span>
                                            <span className="text-2xl font-mono text-emerald-400">${(suggestedPrice * (1 + (taxRate + serviceCharge) / 100)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-2">
                                        Profit: ${projectedProfit.toFixed(2)} • Net Margin: {actualMargin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div >

                        {/* Nutrition Estimate */}
                        < div className="p-4 border-b border-zinc-800" >
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-cyan-500" /> Nutrition Estimate
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Calories', value: nutritionEstimate.calories, unit: 'kcal', color: 'text-amber-400' },
                                    { label: 'Protein', value: nutritionEstimate.protein, unit: 'g', color: 'text-rose-400' },
                                    { label: 'Carbs', value: nutritionEstimate.carbs, unit: 'g', color: 'text-cyan-400' },
                                    { label: 'Fat', value: nutritionEstimate.fat, unit: 'g', color: 'text-purple-400' },
                                ].map(n => (
                                    <div key={n.label} className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                                        <div className="text-[9px] text-zinc-600 uppercase">{n.label}</div>
                                        <div className={`font-mono ${n.color}`}>{n.value}{n.unit}</div>
                                    </div>
                                ))}
                            </div>
                        </div >

                        {/* AI Suggestions */}
                        < div className="flex-1 p-6 overflow-y-auto" >
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-500" /> AI Insights
                            </h3>
                            <div className="space-y-2">
                                {aiSuggestions.length > 0 ? (
                                    aiSuggestions.map((s, i) => (
                                        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400">
                                            <div className={`w-2 h-2 rounded-full inline-block mr-2 ${s.type === 'cost' ? 'bg-amber-500' :
                                                s.type === 'margin' ? 'bg-rose-500' :
                                                    s.type === 'time' ? 'bg-cyan-500' : 'bg-violet-500'
                                                }`}></div>
                                            {s.text}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-zinc-600 text-xs text-center py-8">Add ingredients to see AI recommendations</div>
                                )}
                            </div>
                        </div >

                        {/* Submit Button */}
                        < div className="p-6 border-t border-zinc-800" >
                            <button
                                onClick={handleSubmit}
                                disabled={!newRecipe.name || (newRecipe.ingredients?.length || 0) === 0}
                                className="w-full bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-rose-900/20"
                            >
                                <Save className="w-4 h-4" /> Submit for Approval
                            </button>
                        </div >
                    </div >
                </div >
            )}

            {/* Test Batches Tab */}
            {
                activeTab === 'Testing' && (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-light text-white">Test Batch <span className="font-bold text-rose-500">History</span></h3>
                                <p className="text-xs text-zinc-500 mt-1">Track recipe testing and feedback</p>
                            </div>
                            <button className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition">
                                <Plus className="w-4 h-4" /> Schedule Test
                            </button>
                        </div>

                        <div className="space-y-4">
                            {testBatches.map(batch => (
                                <div key={batch.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${batch.result === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {batch.result === 'Approved' ? <CheckCircle className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-medium text-white">{batch.name}</h4>
                                                <p className="text-xs text-zinc-500 mt-1">Tested by {batch.tester} • {new Date(batch.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${batch.result === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {batch.score.toFixed(1)} ★
                                            </div>
                                            <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded mt-1 ${batch.result === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {batch.result}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                        <p className="text-sm text-zinc-400 italic">"{batch.notes}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Analytics Tab */}
            {activeTab === 'Analytics' && (
                <div className="flex-1 flex flex-col h-full animate-fadeIn p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-light text-white">Culinary <span className="font-bold text-rose-500">Analytics</span></h3>
                            <p className="text-xs text-zinc-500 mt-1">Performance analysis of recipes and menu engineering data.</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
                        <ReportEngine
                            title="Menu Performance Analysis"
                            data={MENU_ITEMS}
                            dimensions={menuDimensions}
                            metrics={menuMetrics}
                            defaultDimension="category"
                            defaultMetric="price"
                        />
                    </div>
                </div>
            )}

            {/* Approval Queue Tab */}
            {activeTab === 'Approval' && (
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-light text-white">Approval <span className="font-bold text-amber-500">Queue</span></h3>
                            <p className="text-xs text-zinc-500 mt-1">Review recipe drafts submitted by the culinary team. Approved recipes are published as live menu items.</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-bold">{RECIPE_DRAFTS.filter(d => d.status === 'Pending Approval').length} Pending</span>
                            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold">{RECIPE_DRAFTS.filter(d => d.status === 'Approved').length} Approved</span>
                            <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold">{RECIPE_DRAFTS.filter(d => d.status === 'Rejected').length} Rejected</span>
                        </div>
                    </div>

                    {RECIPE_DRAFTS.length === 0 ? (
                        <div className="text-center py-20 text-zinc-600">
                            <ThumbsUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-sm">No recipe drafts yet.</p>
                            <p className="text-xs mt-1">Chefs submit recipes from the "Create New" tab.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {RECIPE_DRAFTS.map(draft => {
                                const isPending = draft.status === 'Pending Approval';
                                const isApproved = draft.status === 'Approved';
                                const isRejected = draft.status === 'Rejected';
                                const isLiveOnPOS = isApproved && MENU_ITEMS.some(mi => mi.name === draft.name);
                                const foodCostPct = draft.suggestedPrice > 0 ? (draft.totalCost / draft.suggestedPrice * 100) : 0;

                                return (
                                    <div key={draft.id} className={`bg-zinc-900/50 border rounded-2xl p-6 transition ${isPending ? 'border-amber-500/30' : isApproved ? 'border-emerald-500/20' : 'border-red-500/20'
                                        }`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-medium text-white">{draft.name}</h4>
                                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-500/10 text-amber-400' :
                                                        isApproved ? 'bg-emerald-500/10 text-emerald-400' :
                                                            'bg-red-500/10 text-red-400'
                                                        }`}>{draft.status}</span>
                                                    {isLiveOnPOS && <span className="text-[9px] bg-violet-600 border border-violet-500 text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(139,92,246,0.3)]"><CheckCircle className="w-2.5 h-2.5" /> Live on POS</span>}
                                                    <span className="text-[9px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full uppercase font-bold">{draft.category}</span>
                                                    {draft.complianceFlags?.halal && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold">Halal</span>}
                                                </div>
                                                <div className="flex items-center gap-6 text-xs text-zinc-500 mb-3">
                                                    <span>By {draft.createdBy}</span>
                                                    <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
                                                    <span>{(draft.ingredients || []).length} ingredients</span>
                                                    {draft.prepTime && <span>{draft.prepTime + (draft.cookTime || 0)} min total</span>}
                                                </div>
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                                                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Total Cost</div>
                                                        <div className="text-sm font-mono text-rose-400">${draft.totalCost.toFixed(2)}</div>
                                                    </div>
                                                    <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                                                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Selling Price</div>
                                                        <div className="text-sm font-mono text-white">${draft.suggestedPrice.toFixed(2)}</div>
                                                    </div>
                                                    <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                                                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Food Cost %</div>
                                                        <div className={`text-sm font-mono ${foodCostPct < 30 ? 'text-emerald-400' : foodCostPct < 35 ? 'text-amber-400' : 'text-red-400'}`}>{foodCostPct.toFixed(1)}%</div>
                                                    </div>
                                                    <div className="bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                                                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Gross Margin</div>
                                                        <div className="text-sm font-mono text-emerald-400">{draft.projectedMargin.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                {draft.outletIds && draft.outletIds.length > 0 && (
                                                    <div className="flex gap-2 mt-3">
                                                        <span className="text-[10px] text-zinc-600">Outlets:</span>
                                                        {draft.outletIds.map(oid => {
                                                            const outlet = OUTLETS.find(o => o.id === oid);
                                                            return outlet ? (
                                                                <span key={oid} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold">{outlet.name}</span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                                {isRejected && draft.rejectionNote && (
                                                    <div className="mt-3 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
                                                        <span className="font-bold text-red-400">Rejection note: </span>{draft.rejectionNote}
                                                    </div>
                                                )}
                                                {isApproved && draft.approvedBy && (
                                                    <div className="mt-3 text-xs text-emerald-500/70">
                                                        ✓ Approved by {draft.approvedBy} on {draft.approvedAt ? new Date(draft.approvedAt).toLocaleDateString() : '—'}
                                                    </div>
                                                )}
                                            </div>

                                            {isPending && (
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                // Create MenuItem from draft
                                                                const outletTargets = draft.outletIds && draft.outletIds.length > 0 ? draft.outletIds : OUTLETS.map(o => o.id);
                                                                for (const outletId of outletTargets) {
                                                                    const menuItem: Omit<MenuItem, 'id'> = {
                                                                        outletId,
                                                                        name: draft.name,
                                                                        price: draft.suggestedPrice,
                                                                        category: draft.category,
                                                                        isHalal: draft.complianceFlags?.halal ?? false,
                                                                        isVegan: draft.dietaryTags?.includes('Vegan') ?? false,
                                                                        allergens: draft.allergens || [],
                                                                        department: ['Beverage', 'Cocktail', 'Wine', 'Beer'].some(c => draft.category.includes(c)) ? 'Beverage' : 'Food',
                                                                        ingredients: draft.ingredients,
                                                                        foodCost: draft.totalCost,
                                                                        foodCostPct: draft.suggestedPrice > 0 ? (draft.totalCost / draft.suggestedPrice * 100) : 0,
                                                                        recipeDraftId: draft.id,
                                                                    };
                                                                    await addItem('menuItems', menuItem);
                                                                }
                                                                // Update draft status
                                                                await updateItem('recipeDrafts', draft.id, {
                                                                    status: 'Approved',
                                                                    approvedBy: 'Cost Controller',
                                                                    approvedAt: Date.now(),
                                                                });
                                                                botEngine.logActivity('POS', 'Recipe_Approved', `${draft.name} approved → published to ${outletTargets.length} outlet(s)`, 'Cost_Control');
                                                            } catch (err) {
                                                                console.error('Approval failed:', err);
                                                                alert('Approval failed. Please try again.');
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-900/20"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Approve & Publish
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const note = window.prompt(`Rejection reason for "${draft.name}"?`);
                                                            if (note === null) return; // cancelled
                                                            try {
                                                                await updateItem('recipeDrafts', draft.id, {
                                                                    status: 'Rejected',
                                                                    rejectionNote: note || 'No reason provided',
                                                                });
                                                                botEngine.logActivity('POS', 'Recipe_Rejected', `${draft.name} rejected: ${note}`, 'Cost_Control');
                                                            } catch (err) {
                                                                console.error('Rejection failed:', err);
                                                            }
                                                        }}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-red-600/80 text-zinc-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Recipe Detail Modal */}
            {
                showRecipeDetail && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-12">
                        <div className="bg-transparent w-full h-full flex flex-col">
                            <div className="h-20 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-8">
                                <div>
                                    <h2 className="text-2xl font-light text-white">{showRecipeDetail.name}</h2>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{showRecipeDetail.category} • {showRecipeDetail.isHalal ? 'Halal' : 'Standard'} • ${showRecipeDetail.price.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => setShowRecipeDetail(null)}
                                    className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-3 gap-8">
                                    <div className="col-span-2 space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Prep Time</label>
                                                <div className="text-xl font-light text-white flex items-center gap-2">
                                                    <Timer className="w-4 h-4 text-cyan-500" /> 15 min
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Cook Time</label>
                                                <div className="text-xl font-light text-white flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-orange-500" /> 25 min
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Ingredients</h3>
                                            <div className="border border-zinc-800 rounded-xl overflow-hidden">
                                                {/* Mock ingredients view since MenuItem doesn't store full recipe details in this demo */}
                                                <div className="p-4 bg-zinc-950/30 flex items-center justify-between border-b border-zinc-800/50">
                                                    <span className="text-zinc-300">Premium Wagyu Beef</span>
                                                    <span className="font-mono text-zinc-500">180g</span>
                                                </div>
                                                <div className="p-4 bg-zinc-950/30 flex items-center justify-between border-b border-zinc-800/50">
                                                    <span className="text-zinc-300">Brioche Bun</span>
                                                    <span className="font-mono text-zinc-500">1 pc</span>
                                                </div>
                                                <div className="p-4 bg-zinc-950/30 flex items-center justify-between border-b border-zinc-800/50">
                                                    <span className="text-zinc-300">Truffle Aioli</span>
                                                    <span className="font-mono text-zinc-500">30ml</span>
                                                </div>
                                                <div className="p-4 bg-zinc-950/30 flex items-center justify-between hover:bg-zinc-900/50">
                                                    <span className="text-zinc-300 italic text-sm">See full recipe card for details...</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Technique Notes</h3>
                                            <div className="bg-zinc-950/50 p-6 rounded-xl border border-zinc-800 text-zinc-400 text-sm leading-relaxed">
                                                Sear on high heat to achieve Maillard reaction. Rest for 5 minutes before serving. Assemble with fresh arugula and aged cheddar.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                                            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">Financials</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-[10px] text-zinc-600 uppercase mb-1">Selling Price</div>
                                                    <div className="text-2xl font-mono text-white">${showRecipeDetail.price.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-zinc-600 uppercase mb-1">Est. Cost</div>
                                                    <div className="text-xl font-mono text-rose-400">${(showRecipeDetail.price * 0.3).toFixed(2)}</div>
                                                </div>
                                                <div className="pt-4 border-t border-zinc-800">
                                                    <div className="text-[10px] text-zinc-600 uppercase mb-1">Gross Margin</div>
                                                    <div className="text-xl font-mono text-emerald-400">70.0%</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Allergens</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {showRecipeDetail.allergens?.map(a => (
                                                    <span key={a} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-bold uppercase">
                                                        {a}
                                                    </span>
                                                ))}
                                                {(!showRecipeDetail.allergens || showRecipeDetail.allergens.length === 0) && (
                                                    <span className="text-zinc-600 text-xs italic">No allergens listed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-4">
                                <button
                                    onClick={() => {
                                        handleEditRecipe(showRecipeDetail);
                                        setShowRecipeDetail(null);
                                    }}
                                    className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs uppercase hover:bg-zinc-800 transition"
                                >
                                    Edit Recipe
                                </button>
                                <button
                                    onClick={() => {
                                        handleCloneRecipe(showRecipeDetail);
                                        setShowRecipeDetail(null);
                                    }}
                                    className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs uppercase hover:bg-rose-500 transition shadow-lg shadow-rose-900/20"
                                >
                                    Clone Recipe
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MenuEngineering;
