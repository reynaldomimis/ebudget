import React, { useState, useEffect } from 'react';
import { FormField, Select } from './FormControls';
import TransactionFilterEngine from '../../services/TransactionFilterEngine';
import { mooeAPI } from '../../services/api';
import DataNormalizationEngine from '../../utils/DataNormalizationEngine';

const BudgetFilters = ({
  allotmentClass = 'MOOE',
  onSelectionChange,
  showAllotmentClass = false,
  onAllotmentClassChange
}) => {
  const [papTypes, setPapTypes] = useState([]);
  const [papDescriptions, setPapDescriptions] = useState([]);
  const [offices, setOffices] = useState([]);
  const [names, setNames] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [expenseSubItems, setExpenseSubItems] = useState([]);

  const [selection, setSelection] = useState({
    papType: '',
    papDes: '',
    office: '',
    name: '',
    expenseItem: '',
    expenseSubItem: '',
    mooeId: ''
  });

  // Initial Load: PAP Types based on Allotment Class
  useEffect(() => {
    setSelection({
      papType: '',
      papDes: '',
      office: '',
      name: '',
      expenseItem: '',
      expenseSubItem: '',
      mooeId: ''
    });
    TransactionFilterEngine.getPapTypes(allotmentClass).then(setPapTypes);
  }, [allotmentClass]);

  // Cascade: PAP Type -> PAP Description
  useEffect(() => {
    if (selection.papType) {
      const typeCode = selection.papType.split('|')[0];
      TransactionFilterEngine.getPapDescriptions(allotmentClass, typeCode).then(setPapDescriptions);
    } else {
      setPapDescriptions([]);
    }
  }, [selection.papType, allotmentClass]);

  // Cascade: PAP Description -> Office
  useEffect(() => {
    if (selection.papDes && allotmentClass !== 'PS') {
      const typeCode = selection.papType.split('|')[0];
      const desCode = selection.papDes.split('|')[0];
      TransactionFilterEngine.getOffices(allotmentClass, typeCode, desCode).then(setOffices);
    } else {
      setOffices([]);
    }
  }, [selection.papDes, selection.papType, allotmentClass]);

  useEffect(() => {
    setNames([]);
    if (selection.office && allotmentClass !== 'PS') {
        const filters = {
            pap_type_code: selection.papType.split('|')[0],
            pap_des_code: selection.papDes.split('|')[0],
            office: selection.office
        };
        mooeAPI.getDistinctValues('name', filters).then(res => {
            setNames(res.data.map(n => DataNormalizationEngine.cleanLabel(n)));
        });
    }
  }, [selection.office, selection.papDes, selection.papType, allotmentClass]);

  // Cascade: Name -> Expense Item (Distinct Expense Items for this Name)
  useEffect(() => {
    setExpenseItems([]);
    if (selection.name && allotmentClass === 'MOOE') {
      const filters = {
          pap_type_code: selection.papType.split('|')[0],
          pap_des_code: selection.papDes.split('|')[0],
          office: selection.office,
          name: selection.name
      };
      mooeAPI.getDistinctValues('expense_items', filters).then(res => {
          const items = res.data.map(i => DataNormalizationEngine.cleanLabel(i));
          setExpenseItems(items);
          if (items.length === 1 && !selection.expenseItem) {
            updateSelection('expenseItem', items[0]);
          }
      });
    }
  }, [selection.name, selection.office, selection.papDes, selection.papType, allotmentClass, selection.expenseItem]);

  // Cascade: Expense Item -> Expense Sub Item
  useEffect(() => {
    setExpenseSubItems([]);
    if (selection.expenseItem && allotmentClass === 'MOOE') {
      const filters = {
          pap_type_code: selection.papType.split('|')[0],
          pap_des_code: selection.papDes.split('|')[0],
          office: selection.office,
          name: selection.name,
          expense_items: selection.expenseItem
      };
      mooeAPI.getDistinctValues('expense_items_sub', filters).then(res => {
          const items = res.data.map(i => DataNormalizationEngine.cleanLabel(i));
          setExpenseSubItems(items);
          if (items.length === 1 && !selection.expenseSubItem) {
            updateSelection('expenseSubItem', items[0]);
          }
      });
    }
  }, [selection.expenseItem, selection.name, selection.office, selection.papDes, selection.papType, allotmentClass, selection.expenseSubItem]);

  // Final Step: Resolve mooeId
  useEffect(() => {
    const hasSubItems = expenseSubItems.length > 0;
    const canResolve = selection.name && selection.expenseItem && (!hasSubItems || selection.expenseSubItem);

    if (canResolve && allotmentClass === 'MOOE') {
        const filters = {
            pap_type_code: selection.papType.split('|')[0],
            pap_des_code: selection.papDes.split('|')[0],
            office: selection.office,
            name: selection.name,
            expense_items: selection.expenseItem
        };
        if (selection.expenseSubItem) filters.expense_items_sub = selection.expenseSubItem;

        mooeAPI.getAll(filters).then(res => {
            const records = res.data || [];
            if (records.length > 0) {
                setSelection(prev => ({ ...prev, mooeId: records[0].id.toString() }));
            }
        });
    } else {
        // Clear mooeId if we are no longer in a resolvable state
        setSelection(prev => prev.mooeId ? { ...prev, mooeId: '' } : prev);
    }
  }, [selection.expenseSubItem, selection.expenseItem, selection.name, expenseSubItems, selection.office, selection.papDes, selection.papType, allotmentClass]);

  // Notify parent of selection changes
  useEffect(() => {
    // COMPLETENESS RULE:
    // A selection is complete only if we have resolved the database ID (mooeId)
    // AND if sub-items were present, one must be selected.
    const hasSubItems = expenseSubItems.length > 0;
    const isComplete = !!(
        selection.mooeId &&
        selection.expenseItem &&
        (!hasSubItems || selection.expenseSubItem)
    );

    onSelectionChange({
      ...selection,
      isComplete
    });
  }, [selection.mooeId, selection.expenseItem, selection.expenseSubItem, expenseSubItems.length, onSelectionChange]);

  const updateSelection = (field, value) => {
    const newSelection = { ...selection, [field]: value };

    // Cascading Reset logic
    if (field === 'papType') {
      newSelection.papDes = '';
      newSelection.office = '';
      newSelection.name = '';
      newSelection.expenseItem = '';
      newSelection.expenseSubItem = '';
      newSelection.mooeId = '';
    } else if (field === 'papDes') {
      newSelection.office = '';
      newSelection.name = '';
      newSelection.expenseItem = '';
      newSelection.expenseSubItem = '';
      newSelection.mooeId = '';
    } else if (field === 'office') {
      newSelection.name = '';
      newSelection.expenseItem = '';
      newSelection.expenseSubItem = '';
      newSelection.mooeId = '';
    } else if (field === 'name') {
      newSelection.expenseItem = '';
      newSelection.expenseSubItem = '';
      newSelection.mooeId = '';
    } else if (field === 'expenseItem') {
      newSelection.expenseSubItem = '';
      newSelection.mooeId = '';
    } else if (field === 'expenseSubItem') {
      newSelection.mooeId = '';
    }

    setSelection(newSelection);
  };

  return (
    <div className="space-y-3">
      {showAllotmentClass && (
        <FormField label="Allotment Class">
          <div className="flex bg-neutral-100 p-1 rounded-lg">
             {['PS', 'MOOE', 'CO'].map(cls => (
               <button
                 key={cls}
                 disabled={cls === 'CO'}
                 type="button"
                 onClick={() => onAllotmentClassChange(cls)}
                 className={`flex-1 py-2 text-[10px] font-black rounded transition-all ${allotmentClass === cls ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-400'} ${cls === 'CO' ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 {cls === 'CO' ? 'CO (Soon)' : cls}
               </button>
             ))}
          </div>
        </FormField>
      )}

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

      {allotmentClass === 'MOOE' && (
        <>
          <FormField label="Office">
            <Select value={selection.office} onChange={(e) => updateSelection('office', e.target.value)} disabled={!selection.papDes}>
              <option value="">Select Office...</option>
              {offices.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </FormField>

          <FormField label="Name">
            <Select value={selection.name} onChange={(e) => updateSelection('name', e.target.value)} disabled={!selection.office}>
              <option value="">Select Name...</option>
              {names.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Expense Item">
            <Select value={selection.expenseItem} onChange={(e) => updateSelection('expenseItem', e.target.value)} disabled={!selection.name}>
              <option value="">Select Expense Item...</option>
              {expenseItems.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </FormField>

          {expenseSubItems.length > 0 && (
            <FormField label="Expense Sub Item" className="animate-in slide-in-from-top-2 duration-300">
              <Select value={selection.expenseSubItem} onChange={(e) => updateSelection('expenseSubItem', e.target.value)}>
                <option value="">Select Sub Item...</option>
                {expenseSubItems.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
            </FormField>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetFilters;
