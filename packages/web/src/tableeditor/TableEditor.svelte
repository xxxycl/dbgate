<script lang="ts" context="module">
  import { _t } from '../translations';

  const getCurrentEditor = () => getActiveComponent('TableEditor');

  registerCommand({
    id: 'tableEditor.addColumn',
    category: 'Table editor',
    name: _t('command.tableEditor.addColumn', { defaultMessage: 'Add column' }),
    icon: 'icon add-column',
    toolbar: true,
    isRelatedToTab: true,
    testEnabled: () => getCurrentEditor()?.getIsWritable(),
    onClick: () => getCurrentEditor().addColumn(),
  });

  registerCommand({
    id: 'tableEditor.addPrimaryKey',
    category: 'Table editor',
    name: _t('command.tableEditor.addPrimaryKey', { defaultMessage: 'Add primary key' }),
    icon: 'icon add-key',
    toolbar: true,
    isRelatedToTab: true,
    testEnabled: () => getCurrentEditor()?.allowAddPrimaryKey(),
    onClick: () => getCurrentEditor().addPrimaryKey(),
  });

  registerCommand({
    id: 'tableEditor.addForeignKey',
    category: 'Table editor',
    name: 'Add foreign key',
    icon: 'icon add-key',
    toolbar: true,
    isRelatedToTab: true,
    testEnabled: () => getCurrentEditor()?.getIsWritable() && !getCurrentEditor()?.getDialect()?.omitForeignKeys,
    onClick: () => getCurrentEditor().addForeignKey(),
  });

  registerCommand({
    id: 'tableEditor.addIndex',
    category: 'Table editor',
    name: 'Add index',
    icon: 'icon add-key',
    toolbar: true,
    isRelatedToTab: true,
    testEnabled: () => getCurrentEditor()?.getIsWritable() && !getCurrentEditor()?.getDialect()?.omitIndexes,
    onClick: () => getCurrentEditor().addIndex(),
  });

  registerCommand({
    id: 'tableEditor.addUnique',
    category: 'Table editor',
    name: 'Add unique',
    icon: 'icon add-key',
    toolbar: true,
    isRelatedToTab: true,
    testEnabled: () => getCurrentEditor()?.getIsWritable() && !getCurrentEditor()?.getDialect()?.omitUniqueConstraints,
    onClick: () => getCurrentEditor().addUnique(),
  });
</script>

<script lang="ts">
  import { editorDeleteColumn, editorDeleteConstraint } from 'dbgate-tools';

  import _ from 'lodash';
  import { onMount, tick } from 'svelte';
  import invalidateCommands from '../commands/invalidateCommands';
  import registerCommand from '../commands/registerCommand';

  import ColumnLabel from '../elements/ColumnLabel.svelte';
  import ConstraintLabel from '../elements/ConstraintLabel.svelte';
  import ForeignKeyObjectListControl from '../elements/ForeignKeyObjectListControl.svelte';
  import Link from '../elements/Link.svelte';

  import ObjectListControl from '../elements/ObjectListControl.svelte';
  import { showModal } from '../modals/modalTools';
  import useEditorData from '../query/useEditorData';
  import createActivator, { getActiveComponent } from '../utility/createActivator';

  import { useDbCore } from '../utility/metadataLoaders';
  import ColumnEditorModal from './ColumnEditorModal.svelte';
  import ForeignKeyEditorModal from './ForeignKeyEditorModal.svelte';
  import IndexEditorModal from './IndexEditorModal.svelte';
  import PrimaryKeyEditorModal from './PrimaryKeyEditorModal.svelte';
  import UniqueEditorModal from './UniqueEditorModal.svelte';
  import ObjectFieldsEditor from '../elements/ObjectFieldsEditor.svelte';
  import PrimaryKeyLikeListControl from './PrimaryKeyLikeListControl.svelte';

  export const activator = createActivator('TableEditor', true);

  export let tableInfo;
  export let setTableInfo;
  export let dbInfo;
  export let driver;
  export let resetCounter;
  export let isCreateTable;
  export let schemaList;

  $: isWritable = !!setTableInfo;

  export function getIsWritable() {
    return isWritable;
  }

  export function getDialect() {
    return driver?.dialect;
  }

  export function addColumn() {
    showModal(ColumnEditorModal, {
      setTableInfo,
      tableInfo,
      driver,
      onAddNext: async () => {
        await tick();
        addColumn();
      },
    });
  }

  export function allowAddPrimaryKey() {
    return isWritable && !tableInfo?.primaryKey;
  }

  export function addPrimaryKey() {
    showModal(PrimaryKeyEditorModal, {
      setTableInfo,
      tableInfo,
      driver,
    });
  }

  export function addForeignKey() {
    showModal(ForeignKeyEditorModal, {
      setTableInfo,
      tableInfo,
      dbInfo,
    });
  }

  export function addIndex() {
    showModal(IndexEditorModal, {
      setTableInfo,
      tableInfo,
      dbInfo,
      driver,
    });
  }

  export function addUnique() {
    showModal(UniqueEditorModal, {
      setTableInfo,
      tableInfo,
      dbInfo,
    });
  }

  $: columns = tableInfo?.columns;
  $: foreignKeys = tableInfo?.foreignKeys;
  $: dependencies = tableInfo?.dependencies;
  $: indexes = tableInfo?.indexes;
  $: uniques = tableInfo?.uniques;

  $: {
    tableInfo;
    invalidateCommands();
  }

  $: tableFormOptions = driver?.dialect?.getTableFormOptions?.(tableInfo?.objectId ? 'editTableForm' : 'newTableForm');
</script>

<div class="wrapper">
  {#if tableInfo && (tableFormOptions || isCreateTable)}
    {#key resetCounter}
      <ObjectFieldsEditor
        title={_t('tableEditor.tableProperties', { defaultMessage: 'Table properties' })}
        fieldDefinitions={tableFormOptions ?? []}
        pureNameTitle={isCreateTable ? _t('tableEditor.tableName', { defaultMessage: 'Table name' }) : null}
        schemaList={isCreateTable && schemaList?.length >= 0 ? schemaList : null}
        values={_.pick(tableInfo, ['schemaName', 'pureName', ...(tableFormOptions ?? []).map(x => x.name)])}
        onChangeValues={vals => {
          if (!_.isEmpty(vals) && setTableInfo) {
            setTableInfo(tbl => ({ ...tbl, ...vals }));
          }
        }}
      />
    {/key}
  {/if}

  <ObjectListControl
    collection={columns?.map((x, index) => ({ ...x, ordinal: index + 1 }))}
    title={_t('tableEditor.columnsCount', { defaultMessage: 'Columns ({count})', count: columns?.length || 0 })}
    emptyMessage={_t('tableEditor.noColumnsDefined', { defaultMessage: 'No columns defined' })}
    clickable
    on:clickrow={e => showModal(ColumnEditorModal, { columnInfo: e.detail, tableInfo, setTableInfo, driver })}
    onAddNew={isWritable ? addColumn : null}
    displayNameFieldName="columnName"
    multipleItemsActions={[
      {
        text: _t('tableEditor.remove', { defaultMessage: 'Remove' }),
        icon: 'icon delete',
        onClick: selected => {
          setTableInfo(tbl => {
            const newColumns = tbl.columns.filter(x => !selected.find(y => y.columnName === x.columnName));
            return { ...tbl, columns: newColumns };
          });
        },
      },
      {
        text: 'Copy names',
        icon: 'icon copy',
        onClick: selected => {
          const names = selected.map(x => x.columnName).join('\n');
          navigator.clipboard.writeText(names);
        },
      },
      {
        text: 'Copy definitions',
        icon: 'icon copy',
        onClick: selected => {
          const names = selected
            .map(x => `${x.columnName} ${x.dataType}${x.notNull ? ' NOT NULL' : ''}`)
            .join(',\n');
          navigator.clipboard.writeText(names);
        },
      },
    ]}
    columns={[
      !driver?.dialect?.specificNullabilityImplementation && {
        fieldName: 'notNull',
        header: _t('tableEditor.nullability', { defaultMessage: 'Nullability' }),
        sortable: true,
        slot: 0,
      },
      {
        fieldName: 'dataType',
        header: _t('tableEditor.dataType', { defaultMessage: 'Data Type' }),
        sortable: true,
        filterable: true,
      },
      {
        fieldName: 'defaultValue',
        header: _t('tableEditor.defaultValue', { defaultMessage: 'Default value' }),
        sortable: true,
        filterable: true,
      },
      driver?.dialect?.columnProperties?.isSparse && {
        fieldName: 'isSparse',
        header: _t('tableEditor.isSparse', { defaultMessage: 'Is Sparse' }),
        sortable: true,
        slot: 1,
      },
      {
        fieldName: 'computedExpression',
        header: _t('tableEditor.computedExpression', { defaultMessage: 'Computed Expression' }),
        sortable: true,
        filterable: true,
      },
      driver?.dialect?.columnProperties?.isPersisted && {
        fieldName: 'isPersisted',
        header: _t('tableEditor.isPersisted', { defaultMessage: 'Is Persisted' }),
        sortable: true,
        slot: 2,
      },
      driver?.dialect?.columnProperties?.isUnsigned && {
        fieldName: 'isUnsigned',
        header: _t('tableEditor.unsigned', { defaultMessage: 'Unsigned' }),
        sortable: true,
        slot: 4,
      },
      driver?.dialect?.columnProperties?.isZerofill && {
        fieldName: 'isZerofill',
        header: _t('tableEditor.zeroFill', { defaultMessage: 'Zero fill' }),
        sortable: true,
        slot: 5,
      },
      driver?.dialect?.columnProperties?.columnComment && {
        fieldName: 'columnComment',
        header: _t('tableEditor.comment', { defaultMessage: 'Comment' }),
        sortable: true,
        filterable: true,
      },
      isWritable
        ? {
            fieldName: 'actions',
            filterable: false,
            slot: 3,
          }
        : null,
    ]}
  >
    <svelte:fragment slot="0" let:row>{row?.notNull ? 'NOT NULL' : 'NULL'}</svelte:fragment>
    <svelte:fragment slot="1" let:row>{row?.isSparse ? 'YES' : 'NO'}</svelte:fragment>
    <svelte:fragment slot="2" let:row>{row?.isPersisted ? 'YES' : 'NO'}</svelte:fragment>
    <svelte:fragment slot="3" let:row
      ><Link
        onClick={e => {
          e.stopPropagation();
          setTableInfo(tbl => editorDeleteColumn(tbl, row));
        }}>{_t('tableEditor.remove', { defaultMessage: 'Remove' })}</Link
      ></svelte:fragment
    >
    <svelte:fragment slot="4" let:row>{row?.isUnsigned ? 'YES' : 'NO'}</svelte:fragment>
    <svelte:fragment slot="5" let:row>{row?.isZerofill ? 'YES' : 'NO'}</svelte:fragment>
    <svelte:fragment slot="name" let:row><ColumnLabel {...row} forceIcon /></svelte:fragment>
  </ObjectListControl>

  <PrimaryKeyLikeListControl {tableInfo} {setTableInfo} {isWritable} {driver} />

  {#if driver?.dialect?.sortingKeys}
    <PrimaryKeyLikeListControl
      {tableInfo}
      {setTableInfo}
      {isWritable}
      {driver}
      constraintLabel="sorting key"
      constraintType="sortingKey"
    />
  {/if}

  {#if !driver?.dialect?.omitIndexes}
    <ObjectListControl
      collection={indexes}
      onAddNew={isWritable && columns?.length > 0 ? addIndex : null}
      title={_t('tableEditor.indexesTitle', { defaultMessage: 'Indexes ({count})', values: { count: indexes?.length || 0 } })}
      emptyMessage={isWritable ? _t('tableEditor.noIndexDefined', { defaultMessage: 'No index defined' }) : null}
      clickable
      on:clickrow={e => showModal(IndexEditorModal, { constraintInfo: e.detail, tableInfo, setTableInfo, driver })}
      columns={[
        {
          fieldName: 'columns',
          header: _t('tableEditor.indexColumns', { defaultMessage: 'Columns' }),
          slot: 0,
          sortable: true,
        },
        {
          fieldName: 'unique',
          header: _t('tableEditor.indexUnique', { defaultMessage: 'Unique' }),
          slot: 1,
          sortable: true,
        },
        isWritable
          ? {
              fieldName: 'actions',
              slot: 2,
            }
          : null,
      ]}
    >
      <svelte:fragment slot="name" let:row><ConstraintLabel {...row} /></svelte:fragment>
      <svelte:fragment slot="0" let:row>{row?.columns.map(x => x.columnName).join(', ')}</svelte:fragment>
      <svelte:fragment slot="1" let:row>{row?.isUnique ? _t('common.yes', { defaultMessage: 'YES' }) : _t('common.no', { defaultMessage: 'NO' })}</svelte:fragment>
      <svelte:fragment slot="2" let:row
        ><Link
          onClick={e => {
            e.stopPropagation();
            setTableInfo(tbl => editorDeleteConstraint(tbl, row));
          }}>{_t('tableEditor.remove', { defaultMessage: 'Remove' })}</Link
        ></svelte:fragment
      >
    </ObjectListControl>
  {/if}

  {#if !driver?.dialect?.omitUniqueConstraints}
    <ObjectListControl
      collection={uniques}
      onAddNew={isWritable && columns?.length > 0 ? addUnique : null}
      title={_t('tableEditor.uniqueConstraintsTitle', { defaultMessage: 'Unique constraints ({count})', values: { count: uniques?.length || 0 } })}
      emptyMessage={isWritable ? _t('tableEditor.noUniqueDefined', { defaultMessage: 'No unique defined' }) : null}
      clickable
      on:clickrow={e => showModal(UniqueEditorModal, { constraintInfo: e.detail, tableInfo, setTableInfo })}
      columns={[
        {
          fieldName: 'columns',
          header: _t('tableEditor.uniqueColumns', { defaultMessage: 'Columns' }),
          slot: 0,
          sortable: true,
        },
        isWritable
          ? {
              fieldName: 'actions',
              sortable: true,
              slot: 1,
            }
          : null,
      ]}
    >
      <svelte:fragment slot="name" let:row><ConstraintLabel {...row} /></svelte:fragment>
      <svelte:fragment slot="0" let:row>{row?.columns.map(x => x.columnName).join(', ')}</svelte:fragment>
      <svelte:fragment slot="1" let:row
        ><Link
          onClick={e => {
            e.stopPropagation();
            setTableInfo(tbl => editorDeleteConstraint(tbl, row));
          }}>{_t('tableEditor.remove', { defaultMessage: 'Remove' })}</Link
        ></svelte:fragment
      >
    </ObjectListControl>
  {/if}

  {#if !driver?.dialect?.omitForeignKeys}
    <ForeignKeyObjectListControl
      collection={foreignKeys}
      onAddNew={isWritable && columns?.length > 0 ? addForeignKey : null}
      title={_t('tableEditor.foreignKeysTitle', { defaultMessage: 'Foreign keys ({count})', values: { count: foreignKeys?.length || 0 } })}
      emptyMessage={isWritable ? _t('tableEditor.noForeignKeyDefined', { defaultMessage: 'No foreign key defined' }) : null}
      clickable
      onRemove={row => setTableInfo(tbl => editorDeleteConstraint(tbl, row))}
      on:clickrow={e => showModal(ForeignKeyEditorModal, { constraintInfo: e.detail, tableInfo, setTableInfo, dbInfo })}
    />
    <ForeignKeyObjectListControl collection={dependencies} title={_t('tableEditor.dependencies', { defaultMessage: 'Dependencies' })} />
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: var(--theme-bg-0);
    overflow: auto;
  }
</style>
