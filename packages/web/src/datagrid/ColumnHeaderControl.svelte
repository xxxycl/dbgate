<script>
  import FontIcon from '../icons/FontIcon.svelte';
  import DropDownButton from '../buttons/DropDownButton.svelte';
  import splitterDrag from '../utility/splitterDrag';
  import _ from 'lodash';

  import ColumnLabel from '../elements/ColumnLabel.svelte';
  import { isTypeDateTime } from 'dbgate-tools';
  import { openDatabaseObjectDetail } from '../appobj/DatabaseObjectAppObject.svelte';
  import { copyTextToClipboard } from '../utility/clipboard';
  import VirtualForeignKeyEditorModal from '../tableeditor/VirtualForeignKeyEditorModal.svelte';
  import { showModal } from '../modals/modalTools';
  import { _t } from '../translations';

  export let column;
  export let conid = undefined;
  export let database = undefined;
  export let setSort = undefined;
  export let addToSort = undefined;
  export let clearSort = undefined;
  export let grouping = undefined;
  export let order = undefined;
  export let orderIndex = undefined;
  export let isSortDefined = false;
  export let allowDefineVirtualReferences = false;
  export let setGrouping;
  export let seachInColumns = '';

  const openReferencedTable = () => {
    openDatabaseObjectDetail('TableDataTab', null, {
      schemaName: column.foreignKey.refSchemaName,
      pureName: column.foreignKey.refTableName,
      conid,
      database,
      objectTypeField: 'tables',
    });
  };

  const handleDefineVirtualForeignKey = () => {
    showModal(VirtualForeignKeyEditorModal, {
      schemaName: column.schemaName,
      pureName: column.pureName,
      conid,
      database,
      columnName: column.columnName,
    });
  };

  function getMenu() {
    return [
      setSort && { onClick: () => setSort('ASC'), text: _t('columnHeader.sortAscending', { defaultMessage: 'Sort ascending' }) },
      setSort && { onClick: () => setSort('DESC'), text: _t('columnHeader.sortDescending', { defaultMessage: 'Sort descending' }) },
      isSortDefined && addToSort && !order && { onClick: () => addToSort('ASC'), text: _t('columnHeader.addToSortAscending', { defaultMessage: 'Add to sort - ascending' }) },
      isSortDefined && addToSort && !order && { onClick: () => addToSort('DESC'), text: _t('columnHeader.addToSortDescending', { defaultMessage: 'Add to sort - descending' }) },
      order && clearSort && { onClick: () => clearSort(), text: _t('columnHeader.clearSortCriteria', { defaultMessage: 'Clear sort criteria' }) },
      { onClick: () => copyTextToClipboard(column.columnName), text: _t('columnHeader.copyColumnName', { defaultMessage: 'Copy column name' }) },

      column.foreignKey && [{ divider: true }, { onClick: openReferencedTable, text: column.foreignKey.refTableName }],

      setGrouping && { divider: true },
      setGrouping && { onClick: () => setGrouping('GROUP'), text: _t('columnHeader.groupBy', { defaultMessage: 'Group by' }) },
      setGrouping && { onClick: () => setGrouping('MAX'), text: _t('columnHeader.max', { defaultMessage: 'MAX' }) },
      setGrouping && { onClick: () => setGrouping('MIN'), text: _t('columnHeader.min', { defaultMessage: 'MIN' }) },
      setGrouping && { onClick: () => setGrouping('SUM'), text: _t('columnHeader.sum', { defaultMessage: 'SUM' }) },
      setGrouping && { onClick: () => setGrouping('AVG'), text: _t('columnHeader.avg', { defaultMessage: 'AVG' }) },
      setGrouping && { onClick: () => setGrouping('COUNT'), text: _t('columnHeader.count', { defaultMessage: 'COUNT' }) },
      setGrouping && { onClick: () => setGrouping('COUNT DISTINCT'), text: _t('columnHeader.countDistinct', { defaultMessage: 'COUNT DISTINCT' }) },

      isTypeDateTime(column.dataType) && [
        { divider: true },
        { onClick: () => setGrouping('GROUP:YEAR'), text: _t('columnHeader.groupByYear', { defaultMessage: 'Group by YEAR' }) },
        { onClick: () => setGrouping('GROUP:MONTH'), text: _t('columnHeader.groupByMonth', { defaultMessage: 'Group by MONTH' }) },
        { onClick: () => setGrouping('GROUP:DAY'), text: _t('columnHeader.groupByDay', { defaultMessage: 'Group by DAY' }) },
      ],

      allowDefineVirtualReferences && [
        { divider: true },
        { onClick: handleDefineVirtualForeignKey, text: _t('columnHeader.defineVirtualForeignKey', { defaultMessage: 'Define virtual foreign key' }) },
      ],
    ];
  }
</script>

<div class="header">
  <div class="label">
    {#if grouping}
      <span class="grouping">
        {grouping == 'COUNT DISTINCT' ? 'distinct' : grouping.toLowerCase()}
      </span>
    {/if}
    <ColumnLabel {...column} filter={seachInColumns} />

    {#if _.isString(column.displayedDataType || column.dataType) && !order}
      <span class="data-type" title={column.dataType}>
        {(column.displayedDataType || column.dataType).toLowerCase()}
      </span>
    {/if}
  </div>
  {#if order == 'ASC'}
    <span class="icon">
      <FontIcon icon="img sort-asc" />
      {#if orderIndex >= 0}
        <span class="color-icon-green order-index">{orderIndex + 1}</span>
      {/if}
    </span>
  {/if}
  {#if order == 'DESC'}
    <span class="icon">
      <FontIcon icon="img sort-desc" />
      {#if orderIndex >= 0}
        <span class="color-icon-green order-index">{orderIndex + 1}</span>
      {/if}
    </span>
  {/if}
  <DropDownButton menu={getMenu} narrow />
  <div class="horizontal-split-handle resizeHandleControl" use:splitterDrag={'clientX'} on:resizeSplitter />
</div>

<style>
  .header {
    display: flex;
    flex-wrap: nowrap;
  }
  .order-index {
    font-size: 10pt;
    margin-left: -3px;
    margin-right: 2px;
    top: -1px;
    position: relative;
  }
  .label {
    flex: 1;
    min-width: 10px;
    padding: 2px;
    margin: auto;
    white-space: nowrap;
  }
  .icon {
    margin-left: 3px;
    align-self: center;
    font-size: 18px;
  }
  /* .resizer {
    background-color: var(--theme-border);
    width: 2px;
    cursor: col-resize;
    z-index: 1;
  } */
  .grouping {
    color: var(--theme-font-alt);
    white-space: nowrap;
  }
  .data-type {
    color: var(--theme-font-3);
  }
</style>
