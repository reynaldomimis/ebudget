import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FormField, Select } from './FormControls';
import { financialAPI } from '../../services/api';
import { useFiscalYear } from '../../context/FiscalYearContext';

const BudgetFilters = ({
  allotmentClass = 'MOOE',
  onSelectionChange,
  showAllotmentClass = false,
  onAllotmentClassChange,
  initialSelection = null
}) => {
  const { selectedYear } = useFiscalYear();
  const [filters, setFilters] = useState({ mooe: {}, ps: {} });
  const [loading, setLoading] = useState(true);
  const isHydrating = useRef(!!initialSelection);

  const [selection, setSelection] = useState({
    papType: '',
    papDes: '',
    office: '',
    name: '',
    expenseItem: '',
    expenseSubItem: '',
    mooeId: ''
  });

  // 1. Unified Fetch & Hydration logic
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await financialAPI.getFilters({ plan_id: selectedYear });
        if (res.success) {
          setFilters(res.data);

          // Apply initial values ONLY when options are ready
          if (initialSelection && isHydrating.current) {
            setSelection(initialSelection);
          }
        }
      } catch (err) {
        console.error("Failed to load budget filters:", err);
      } finally {
        // Small delay to allow React to render the options before releasing the value lock
        setTimeout(() => setLoading(false), 50);
      }
    };
    loadData();
  }, [selectedYear, initialSelection]);

  // 2. Prevent Reset on Mount
  useEffect(() => {
    if (!loading && !isHydrating.current && !initialSelection) {
      setSelection({
        papType: '', papDes: '', office: '', name: '',
        expenseItem: '', expenseSubItem: '', mooeId: ''
      });
    }
  }, [allotmentClass, selectedYear]);

  // 3. Memoized Options
  const papTypes = useMemo(() => {
    if (allotmentClass === 'PS') return Object.keys(filters.ps || {});
    return Object.keys(filters.mooe || {});
  }, [filters, allotmentClass]);

  const papDescriptions = useMemo(() => {
    if (!selection.papType || !filters.mooe) return [];
    return Object.keys(filters.mooe[selection.papType] || {});
  }, [selection.papType, filters]);

  const offices = useMemo(() => {
    if (!selection.papDes || !filters.mooe?.[selection.papType]) return [];
    return Object.keys(filters.mooe[selection.papType][selection.papDes] || {});
  }, [selection.papDes, selection.papType, filters]);

  const names = useMemo(() => {
    if (!selection.office || !filters.mooe?.[selection.papType]?.[selection.papDes]) return [];
    return Object.keys(filters.mooe[selection.papType][selection.papDes][selection.office] || {});
  }, [selection.office, selection.papDes, selection.papType, filters]);

  const expenseItems = useMemo(() => {
    if (!selection.name || !filters.mooe?.[selection.papType]?.[selection.papDes]?.[selection.office]) return [];
    return Object.keys(filters.mooe[selection.papType][selection.papDes][selection.office][selection.name] || {});
  }, [selection.name, selection.office, selection.papDes, selection.papType, filters]);

  const expenseSubItems = useMemo(() => {
    if (!selection.expenseItem || !filters.mooe?.[selection.papType]?.[selection.papDes]?.[selection.office]?.[selection.name]) return [];
    return filters.mooe[selection.papType][selection.papDes][selection.office][selection.name][selection.expenseItem] || [];
  }, [selection.expenseItem, selection.name, selection.office, selection.papDes, selection.papType, filters]);

  // 4. Update Parent
  useEffect(() => {
    if (loading) return; // Don't notify while still loading filters

    const isComplete = allotmentClass === 'PS'
        ? (!!selection.papType && !!selection.papDes)
        : (!!selection.mooeId);

    onSelectionChange({ ...selection, isComplete });

    if (selection.mooeId) isHydrating.current = false;
  }, [selection, allotmentClass, loading]);

  const updateSelection = (field, value) => {
    isHydrating.current = false;
    const newSelection = { ...selection, [field]: value };
    const fields = ['papType', 'papDes', 'office', 'name', 'expenseItem', 'expenseSubItem', 'mooeId'];
    const idx = fields.indexOf(field);

    // Correct loop: clear only subsequent fields
    for (let i = idx + 1; i < fields.length; i++) {
        newSelection[fields[i]] = '';
    }
    setSelection(newSelection);
  };

  // Sync MOOE ID for sub-items
  useEffect(() => {
    if (selection.expenseItem && expenseSubItems.length > 0) {
        const found = expenseSubItems.find(i => i.label === selection.expenseSubItem);
        if (found && found.id.toString() !== selection.mooeId) {
            setSelection(prev => ({ ...prev, mooeId: found.id.toString() }));
        }
    }
  }, [selection.expenseSubItem, selection.expenseItem, expenseSubItems]);

  if (loading) return <div className="text-[10px] font-black text-slate-400 uppercase p-4 animate-pulse">Pre-filling Budget Sources...</div>;

  return (
    <div className="space-y-3">
      <FormField label="PAP Type">
        <Select value={selection.papType} onChange={(e) => updateSelection('papType', e.target.value)}>
          <option value="">Select PAP Type...</option>
          {papTypes.map(opt => {
              const [code, label] = opt.includes('|') ? opt.split('|') : [opt, opt];
              return <option key={opt} value={opt}>{code} - {label}</option>
          })}
        </Select>
      </FormField>

      <FormField label="PAP Description">
        <Select value={selection.papDes} onChange={(e) => updateSelection('papDes', e.target.value)} disabled={!selection.papType}>
          <option value="">Select Description...</option>
          {papDescriptions.map(opt => {
              const [code, label] = opt.includes('|') ? opt.split('|') : [opt, opt];
              return <option key={opt} value={opt}>{code} - {label}</option>
          })}
        </Select>
      </FormField>

      <FormField label="Office">
        <Select value={selection.office} onChange={(e) => updateSelection('office', e.target.value)} disabled={!selection.papDes}>
          <option value="">Select Office...</option>
          {offices.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      </FormField>

      <FormField label="Name">
        <Select value={selection.name} onChange={(e) => updateSelection('name', e.target.value)} disabled={!selection.office}>
          <option value="">Select Name...</option>
          {names.map(name => <option key={name} value={name}>{name}</option>)}
        </Select>
      </FormField>

      <FormField label="Expense Item">
        <Select value={selection.expenseItem} onChange={(e) => updateSelection('expenseItem', e.target.value)} disabled={!selection.name}>
          <option value="">Select Expense Item...</option>
          {expenseItems.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      </FormField>

      {expenseSubItems.length > 0 && (
        <FormField label="Expense Sub Item">
          <Select value={selection.expenseSubItem} onChange={(e) => updateSelection('expenseSubItem', e.target.value)}>
            <option value="">Select Sub Item...</option>
            {expenseSubItems.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
          </Select>
        </FormField>
      )}
    </div>
  );
};

export default BudgetFilters;
