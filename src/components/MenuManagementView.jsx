import React, { useState, useMemo, useEffect } from 'react';
import { usePos } from '../context/PosContext';

export default function MenuManagementView() {
  const {
    setScreenMode,
    categories,
    menuItems,
    refreshMenuAndCategories,
    addOrUpdateCategory,
    reorderCategories,
    renameCategory,
    deleteCategory,
    addOrUpdateMenuItem,
    deleteMenuItem,
  } = usePos();

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: 'info' });

  // Dialog Modals State
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemFormData, setItemFormData] = useState({
    code: '',
    name: '',
    category: '',
    acRate: '',
    hallRate: '',
    isKitchen: true,
    isAvailable: true,
  });
  const [isEditingItem, setIsEditingItem] = useState(false);

  const [showCatModal, setShowCatModal] = useState(false);
  const [catFormData, setCatFormData] = useState({
    name: '',
    department: 'KITCHEN',
  });
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [editingCatOldName, setEditingCatOldName] = useState('');

  // Show status toast helper
  const showToast = (text, type = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage({ text: '', type: 'info' });
    }, 3500);
  };

  // Keyboard shortcut listener (Esc to close, F5 to refresh)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showItemModal) {
          setShowItemModal(false);
          return;
        }
        if (showCatModal) {
          setShowCatModal(false);
          return;
        }
        setScreenMode('ORDER');
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showItemModal, showCatModal]);

  const handleRefresh = async () => {
    setIsLoading(true);
    showToast('Syncing with Supabase Live Database...', 'info');
    await refreshMenuAndCategories();
    setIsLoading(false);
    showToast('Menu & Categories updated live from Supabase!', 'success');
  };

  // Sorted Categories list
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.categoryOrder || 99) - (b.categoryOrder || 99));
  }, [categories]);

  // Dish count per category map
  const dishCountsByCat = useMemo(() => {
    const counts = {};
    (menuItems || []).forEach(it => {
      const cat = (it.category || 'UNCATEGORIZED').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  // Filtered Menu Items
  const filteredDishes = useMemo(() => {
    let list = menuItems || [];

    if (selectedCategory !== 'ALL') {
      list = list.filter(it => (it.category || '').toUpperCase() === selectedCategory.toUpperCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter(it => {
        const code = String(it.code || '').toUpperCase();
        const name = String(it.name || '').toUpperCase();
        const acr = Array.isArray(it.acronyms) ? it.acronyms.join(' ') : '';
        return code.includes(q) || name.includes(q) || acr.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      const oA = a.categoryOrder ?? 99;
      const oB = b.categoryOrder ?? 99;
      if (oA !== oB) return oA - oB;
      return (Number(a.code) || 0) - (Number(b.code) || 0);
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Category Move Up / Down
  const handleMoveCategory = async (index, direction) => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedCategories.length) return;

    const newList = [...sortedCategories];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIdx, 0, moved);

    setIsLoading(true);
    showToast(`Reordered "${moved.name}" to position #${targetIdx + 1}...`, 'info');
    await reorderCategories(newList);
    setIsLoading(false);
    showToast(`Updated category order saved to Supabase!`, 'success');
  };

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setCatFormData({ name: '', department: 'KITCHEN' });
    setIsEditingCat(false);
    setEditingCatOldName('');
    setShowCatModal(true);
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat) => {
    setCatFormData({ name: cat.name, department: cat.department || 'KITCHEN' });
    setIsEditingCat(true);
    setEditingCatOldName(cat.name);
    setShowCatModal(true);
  };

  // Submit Category Form
  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const cleanName = catFormData.name.trim().toUpperCase();
    if (!cleanName) return;

    setShowCatModal(false);
    setIsLoading(true);

    if (isEditingCat) {
      if (cleanName !== editingCatOldName) {
        showToast(`Renaming "${editingCatOldName}" to "${cleanName}" in Supabase...`, 'info');
        await renameCategory(editingCatOldName, cleanName);
      }
      await addOrUpdateCategory({
        name: cleanName,
        department: catFormData.department,
      });
      showToast(`Category "${cleanName}" updated in Supabase!`, 'success');
    } else {
      showToast(`Adding category "${cleanName}" to Supabase...`, 'info');
      await addOrUpdateCategory({
        name: cleanName,
        department: catFormData.department,
        categoryOrder: sortedCategories.length + 1,
      });
      showToast(`Category "${cleanName}" created in Supabase!`, 'success');
    }
    setIsLoading(false);
  };

  // Delete Category
  const handleDeleteCategory = async (catName) => {
    const count = dishCountsByCat[catName] || 0;
    const msg = count > 0
      ? `Category "${catName}" has ${count} dishes! Are you sure you want to delete this category from Supabase?`
      : `Delete category "${catName}" from Supabase?`;
    if (!window.confirm(msg)) return;

    setIsLoading(true);
    showToast(`Deleting category "${catName}" from Supabase...`, 'info');
    await deleteCategory(catName);
    if (selectedCategory === catName) setSelectedCategory('ALL');
    setIsLoading(false);
    showToast(`Category "${catName}" removed from Supabase!`, 'success');
  };

  // Open Add Dish Modal
  const handleOpenAddDish = () => {
    // Generate next suggested code
    const existingCodes = (menuItems || []).map(it => Number(it.code)).filter(n => !isNaN(n));
    const nextCode = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;

    const defaultCat = (selectedCategory !== 'ALL' && selectedCategory) ? selectedCategory : (sortedCategories[0]?.name || 'SOUP');

    setItemFormData({
      code: String(nextCode),
      name: '',
      category: defaultCat,
      acRate: '',
      hallRate: '',
      isKitchen: true,
      isAvailable: true,
    });
    setIsEditingItem(false);
    setShowItemModal(true);
  };

  // Open Edit Dish Modal
  const handleOpenEditDish = (item) => {
    setItemFormData({
      code: String(item.code),
      name: item.name || '',
      category: item.category || (sortedCategories[0]?.name || 'SOUP'),
      acRate: String(item.acRate ?? 0),
      hallRate: String(item.hallRate ?? item.acRate ?? 0),
      isKitchen: item.isKitchen !== false,
      isAvailable: item.isAvailable !== false,
    });
    setIsEditingItem(true);
    setShowItemModal(true);
  };

  // Submit Dish Form
  const handleSubmitDish = async (e) => {
    e.preventDefault();
    const cleanCode = itemFormData.code.trim();
    const cleanName = itemFormData.name.trim().toUpperCase();
    if (!cleanCode || !cleanName) return;

    setShowItemModal(false);
    setIsLoading(true);
    showToast(`Saving dish #${cleanCode} "${cleanName}" to Supabase...`, 'info');

    const acRate = Number(itemFormData.acRate) || 0;
    const hallRate = itemFormData.hallRate ? Number(itemFormData.hallRate) : acRate;

    await addOrUpdateMenuItem({
      code: cleanCode,
      name: cleanName,
      category: itemFormData.category,
      acRate,
      hallRate,
      isKitchen: itemFormData.isKitchen,
      isAvailable: itemFormData.isAvailable,
    });

    setIsLoading(false);
    showToast(`Dish #${cleanCode} "${cleanName}" saved live to Supabase!`, 'success');
  };

  // Toggle Dish Availability (Instant 1-click 86 stock toggle)
  const handleToggleAvailability = async (item) => {
    const updated = {
      ...item,
      isAvailable: !item.isAvailable,
    };
    await addOrUpdateMenuItem(updated);
    showToast(`Dish #${item.code} marked ${updated.isAvailable ? 'AVAILABLE (In Stock)' : 'UNAVAILABLE (86 Out of Stock)'}`, 'info');
  };

  // Delete Dish
  const handleDeleteDish = async (item) => {
    if (!window.confirm(`Are you sure you want to delete #${item.code} "${item.name}" from Supabase?`)) return;

    setIsLoading(true);
    showToast(`Deleting dish #${item.code} from Supabase...`, 'info');
    await deleteMenuItem(item.code);
    setIsLoading(false);
    showToast(`Dish #${item.code} permanently deleted from Supabase!`, 'success');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#ece9d8',
      color: '#000000',
      fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
      fontSize: '12px',
      overflow: 'hidden'
    }}>
      {/* Top Retro Studio Bar */}
      <div style={{
        backgroundColor: '#0a246a',
        color: '#ffffff',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #808080',
        fontWeight: 'bold',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📖</span>
          <span>Dominal's POS — Menu &amp; Categories Studio (Live Supabase Management)</span>
          <span style={{
            fontSize: '11px',
            backgroundColor: '#008000',
            color: '#fff',
            padding: '1px 6px',
            borderRadius: '3px',
            marginLeft: '8px'
          }}>
            ☁️ Connected to Cloud DB
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '3px 10px',
              backgroundColor: '#ece9d8',
              color: '#000',
              border: '2px outset #ffffff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            {isLoading ? 'Syncing...' : '⟳ Refresh Cloud (F5)'}
          </button>
          <button
            onClick={() => setScreenMode('ORDER')}
            style={{
              padding: '3px 14px',
              backgroundColor: '#c00000',
              color: '#ffffff',
              border: '2px outset #ffffff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '11px'
            }}
          >
            ✕ Back to POS (Esc)
          </button>
        </div>
      </div>

      {/* Action / Notification Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: '#d4d0c8',
        borderBottom: '1px solid #808080',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, maxWidth: '450px' }}>
          <label htmlFor="menu-dish-search" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Dish Search:</label>
          <input
            id="menu-dish-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type Dish Code (e.g. 1) or Name / Acronym..."
            style={{
              flex: 1,
              padding: '3px 6px',
              border: '2px inset #808080',
              backgroundColor: '#ffffff',
              fontSize: '12px',
              fontWeight: 'bold',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Toast Alert */}
        {statusMessage.text && (
          <div style={{
            padding: '3px 12px',
            backgroundColor: statusMessage.type === 'success' ? '#2e7d32' : '#0277bd',
            color: '#ffffff',
            fontWeight: 'bold',
            borderRadius: '3px',
            fontSize: '11px'
          }}>
            {statusMessage.text}
          </div>
        )}

        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleOpenAddCategory}
            style={{
              padding: '4px 12px',
              backgroundColor: '#ece9d8',
              border: '2px outset #fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+</span> Add Category
          </button>
          <button
            onClick={handleOpenAddDish}
            style={{
              padding: '4px 14px',
              backgroundColor: '#0a246a',
              color: '#ffffff',
              border: '2px outset #fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+</span> Add New Dish
          </button>
        </div>
      </div>

      {/* Main Split Body: Categories (Left) vs Menu Items (Right) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Categories Manager */}
        <div style={{
          width: '360px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '2px solid #808080',
          backgroundColor: '#f5f4ef'
        }}>
          {/* Panel Header */}
          <div style={{
            backgroundColor: '#d4d0c8',
            padding: '6px 10px',
            borderBottom: '2px groove #fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>📁 Categories Order</div>
              <div style={{ fontSize: '10px', color: '#555' }}>Dictates KOT &amp; Bill course sorting</div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#e0e0e0', padding: '1px 6px', border: '1px solid #999' }}>
              {sortedCategories.length} Categories
            </span>
          </div>

          {/* "All Categories" Tab */}
          <div
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '7px 12px',
              backgroundColor: selectedCategory === 'ALL' ? '#0a246a' : '#ffffff',
              color: selectedCategory === 'ALL' ? '#ffffff' : '#000000',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderBottom: '1px solid #d4d0c8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>🌐 ALL CATEGORIES</span>
            <span style={{
              fontSize: '11px',
              backgroundColor: selectedCategory === 'ALL' ? 'rgba(255,255,255,0.3)' : '#ece9d8',
              padding: '1px 6px',
              borderRadius: '2px'
            }}>
              {(menuItems || []).length}
            </span>
          </div>

          {/* Categories List with Move Up / Move Down */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sortedCategories.map((cat, idx) => {
              const isSelected = selectedCategory.toUpperCase() === cat.name.toUpperCase();
              const count = dishCountsByCat[cat.name] || 0;

              return (
                <div
                  key={`cat-${cat.name}-${idx}`}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: isSelected ? '#316ac5' : idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                    color: isSelected ? '#ffffff' : '#000000',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {/* Order Badge */}
                  <span style={{
                    width: '26px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? '#ffffff' : '#e0e0e0',
                    color: isSelected ? '#0a246a' : '#333333',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '1px solid #999',
                    marginRight: '8px',
                    flexShrink: 0
                  }}>
                    #{idx + 1}
                  </span>

                  {/* Category Name & Dept */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: '10px', color: isSelected ? '#d0e0ff' : '#666' }}>
                      {cat.department === 'PANTRY' ? '🍹 Counter/Pantry' : '🍳 Kitchen'} • {count} dishes
                    </div>
                  </div>

                  {/* Reorder Buttons: Move Up / Down */}
                  <div style={{ display: 'flex', gap: '3px', marginLeft: '6px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Move Up in Culinary Course"
                      disabled={idx === 0 || isLoading}
                      onClick={() => handleMoveCategory(idx, 'UP')}
                      style={{
                        width: '24px',
                        height: '22px',
                        padding: 0,
                        backgroundColor: '#ece9d8',
                        border: '1px outset #fff',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        opacity: idx === 0 ? 0.3 : 1
                      }}
                    >
                      ▲
                    </button>
                    <button
                      title="Move Down in Culinary Course"
                      disabled={idx === sortedCategories.length - 1 || isLoading}
                      onClick={() => handleMoveCategory(idx, 'DOWN')}
                      style={{
                        width: '24px',
                        height: '22px',
                        padding: 0,
                        backgroundColor: '#ece9d8',
                        border: '1px outset #fff',
                        cursor: idx === sortedCategories.length - 1 ? 'default' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        opacity: idx === sortedCategories.length - 1 ? 0.3 : 1
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Edit / Delete Category */}
                  <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Edit Category Name"
                      onClick={() => handleOpenEditCategory(cat)}
                      style={{
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        backgroundColor: '#ece9d8',
                        border: '1px outset #fff',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      ✎
                    </button>
                    <button
                      title="Delete Category"
                      onClick={() => handleDeleteCategory(cat.name)}
                      style={{
                        width: '22px',
                        height: '22px',
                        padding: 0,
                        backgroundColor: '#ece9d8',
                        border: '1px outset #fff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: '#c00000'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Menu Items Ledger */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          {/* Header Info */}
          <div style={{
            backgroundColor: '#d4d0c8',
            padding: '6px 12px',
            borderBottom: '2px groove #fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
              Dishes in {selectedCategory === 'ALL' ? 'All Categories' : `[${selectedCategory}]`}
              <span style={{ fontWeight: 'normal', color: '#555', marginLeft: '8px' }}>
                ({filteredDishes.length} items found)
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#333' }}>
              💡 Click status pill to instantly toggle 86 Out of Stock
            </div>
          </div>

          {/* Dishes Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{
                  backgroundColor: '#ece9d8',
                  borderBottom: '2px solid #808080',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2
                }}>
                  <th style={{ padding: '6px 8px', width: '60px', borderRight: '1px solid #d4d0c8' }}>Code</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #d4d0c8' }}>Dish Name</th>
                  <th style={{ padding: '6px 8px', width: '150px', borderRight: '1px solid #d4d0c8' }}>Category</th>
                  <th style={{ padding: '6px 8px', width: '70px', borderRight: '1px solid #d4d0c8', textAlign: 'center' }}>Course #</th>
                  <th style={{ padding: '6px 8px', width: '85px', borderRight: '1px solid #d4d0c8', textAlign: 'right' }}>AC Rate</th>
                  <th style={{ padding: '6px 8px', width: '85px', borderRight: '1px solid #d4d0c8', textAlign: 'right' }}>Hall Rate</th>
                  <th style={{ padding: '6px 8px', width: '100px', borderRight: '1px solid #d4d0c8', textAlign: 'center' }}>Routing</th>
                  <th style={{ padding: '6px 8px', width: '110px', borderRight: '1px solid #d4d0c8', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '6px 8px', width: '90px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                      No dishes found matching the current category or search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDishes.map((it, idx) => {
                    const isAvailable = it.isAvailable !== false;
                    return (
                      <tr
                        key={`dish-${it.code}-${idx}`}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                          borderBottom: '1px solid #e8e8e8',
                          opacity: isAvailable ? 1 : 0.65
                        }}
                      >
                        <td style={{ padding: '5px 8px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px' }}>
                          {it.code}
                        </td>
                        <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>
                          {it.name}
                        </td>
                        <td style={{ padding: '5px 8px', color: '#444' }}>
                          {it.category}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#0a246a' }}>
                          #{it.categoryOrder}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                          ₹{Number(it.acRate).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                          ₹{Number(it.hallRate ?? it.acRate).toFixed(2)}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: it.isKitchen !== false ? '#e3f2fd' : '#fff3e0',
                            color: it.isKitchen !== false ? '#0d47a1' : '#e65100'
                          }}>
                            {it.isKitchen !== false ? '🍳 KITCHEN' : '🍹 PANTRY'}
                          </span>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleAvailability(it)}
                            title="Click to toggle availability"
                            style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              borderRadius: '3px',
                              border: '1px solid',
                              cursor: 'pointer',
                              backgroundColor: isAvailable ? '#e8f5e9' : '#ffebee',
                              color: isAvailable ? '#2e7d32' : '#c62828',
                              borderColor: isAvailable ? '#a5d6a7' : '#ef9a9a'
                            }}
                          >
                            {isAvailable ? '✓ In Stock' : '✗ 86 Out'}
                          </button>
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleOpenEditDish(it)}
                              title="Edit Dish"
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#ece9d8',
                                border: '1px outset #fff',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '11px'
                              }}
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDeleteDish(it)}
                              title="Delete Dish"
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#ece9d8',
                                border: '1px outset #fff',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                color: '#c00000'
                              }}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal 1: Add / Edit Dish Form */}
      {showItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '460px',
            backgroundColor: '#ece9d8',
            border: '3px solid #0055ea',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Titlebar */}
            <div style={{
              backgroundColor: '#0055ea',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span>{isEditingItem ? `Edit Dish (#${itemFormData.code})` : 'Add New Dish to Supabase'}</span>
              <button
                onClick={() => setShowItemModal(false)}
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: '#ece9d8',
                  border: '1px outset #fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitDish} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '120px' }}>
                  <label htmlFor="menu-dish-code" style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Code *:</label>
                  <input
                    id="menu-dish-code"
                    type="text"
                    required
                    disabled={isEditingItem}
                    value={itemFormData.code}
                    onChange={(e) => setItemFormData({ ...itemFormData, code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '2px inset #808080',
                      backgroundColor: isEditingItem ? '#e0e0e0' : '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="menu-dish-name" style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Dish Name *:</label>
                  <input
                    id="menu-dish-name"
                    type="text"
                    required
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    placeholder="e.g. BUTTER CHICKEN"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '2px inset #808080',
                      backgroundColor: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="menu-dish-category" style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Category *:</label>
                <select
                  id="menu-dish-category"
                  value={itemFormData.category}
                  onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '2px inset #808080',
                    backgroundColor: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  {sortedCategories.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} (Course #{c.categoryOrder})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="menu-dish-ac-rate" style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>AC Rate (₹) *:</label>
                  <input
                    id="menu-dish-ac-rate"
                    type="number"
                    step="0.01"
                    required
                    value={itemFormData.acRate}
                    onChange={(e) => setItemFormData({ ...itemFormData, acRate: e.target.value })}
                    placeholder="e.g. 150"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '2px inset #808080',
                      backgroundColor: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label htmlFor="menu-dish-hall-rate" style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Hall Rate (₹):</label>
                  <input
                    id="menu-dish-hall-rate"
                    type="number"
                    step="0.01"
                    value={itemFormData.hallRate}
                    onChange={(e) => setItemFormData({ ...itemFormData, hallRate: e.target.value })}
                    placeholder="Leave empty if same as AC"
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      border: '2px inset #808080',
                      backgroundColor: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', padding: '6px', backgroundColor: '#e4e0d4', border: '1px solid #b0a89a' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={itemFormData.isKitchen}
                    onChange={(e) => setItemFormData({ ...itemFormData, isKitchen: e.target.checked })}
                  />
                  <span>Route to Kitchen KDS (Cook ticket)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={itemFormData.isAvailable}
                    onChange={(e) => setItemFormData({ ...itemFormData, isAvailable: e.target.checked })}
                  />
                  <span>Active &amp; Available (In Stock)</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#ece9d8',
                    border: '2px outset #ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 20px',
                    backgroundColor: '#0a246a',
                    color: '#ffffff',
                    border: '2px outset #ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save to Supabase Live (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Category Form */}
      {showCatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            width: '400px',
            backgroundColor: '#ece9d8',
            border: '3px solid #0055ea',
            boxShadow: '4px 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#0055ea',
              color: '#ffffff',
              padding: '4px 8px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px'
            }}>
              <span>{isEditingCat ? `Rename Category "${editingCatOldName}"` : 'Add New Category'}</span>
              <button
                onClick={() => setShowCatModal(false)}
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: '#ece9d8',
                  border: '1px outset #fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Category Name *:</label>
                <input
                  type="text"
                  required
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  placeholder="e.g. SIZZLERS"
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '2px inset #808080',
                    backgroundColor: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '3px' }}>Department / Routing:</label>
                <select
                  value={catFormData.department}
                  onChange={(e) => setCatFormData({ ...catFormData, department: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    border: '2px inset #808080',
                    backgroundColor: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  <option value="KITCHEN">🍳 Kitchen (Main Chef KDS)</option>
                  <option value="PANTRY">🍹 Pantry / Bar / Counter (Desserts, Drinks, Water)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#ece9d8',
                    border: '2px outset #ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 20px',
                    backgroundColor: '#0a246a',
                    color: '#ffffff',
                    border: '2px outset #ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Save Category (↵)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

