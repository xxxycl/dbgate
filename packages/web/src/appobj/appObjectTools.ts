import { _t } from '../translations';

export function matchDatabaseObjectAppObject(obj1, obj2) {
  return (
    obj1?.objectTypeField == obj2?.objectTypeField &&
    obj1?.conid == obj2?.conid &&
    obj1?.database == obj2?.database &&
    obj1?.pureName == obj2?.pureName &&
    obj1?.schemaName == obj2?.schemaName
  );
}

function getTableLikeActions(dataTab) {
  return [
    {
      label: _t('appObject.openData', { defaultMessage: 'Open data' }),
      tab: dataTab,
      defaultActionId: 'openTable',
    },
    {
      label: _t('appObject.openRawData', { defaultMessage: 'Open raw data' }),
      tab: dataTab,
      defaultActionId: 'openRawTable',
      isRawMode: true,
      icon: dataTab == 'ViewDataTab' ? 'img raw-view' : 'img raw-table',
    },
    // {
    //   label: 'Open form',
    //   tab: dataTab,
    //   initialData: {
    //     grid: {
    //       isFormView: true,
    //     },
    //   },
    //   defaultActionId: 'openForm',
    // },
    {
      label: _t('appObject.openStructure', { defaultMessage: 'Open structure' }),
      tab: 'TableStructureTab',
      icon: 'img table-structure',
      defaultActionId: 'openStructure',
    },
    {
      label: _t('appObject.showSql', { defaultMessage: 'Show SQL' }),
      tab: 'SqlObjectTab',
      defaultActionId: 'showSql',
      icon: 'img sql-file',
    },
  ];
}

export const defaultDatabaseObjectAppObjectActions = {
  tables: getTableLikeActions('TableDataTab'),
  views: getTableLikeActions('ViewDataTab'),
  matviews: getTableLikeActions('ViewDataTab'),
  procedures: [
    {
      label: _t('appObject.showSql', { defaultMessage: 'Show SQL' }),
      tab: 'SqlObjectTab',
      defaultActionId: 'showSql',
      icon: 'img sql-file',
    },
  ],
  functions: [
    {
      label: _t('appObject.showSql', { defaultMessage: 'Show SQL' }),
      tab: 'SqlObjectTab',
      defaultActionId: 'showSql',
      icon: 'img sql-file',
    },
  ],
  triggers: [
    {
      label: _t('appObject.showSql', { defaultMessage: 'Show SQL' }),
      tab: 'SqlObjectTab',
      defaultActionId: 'showSql',
      icon: 'img sql-file',
    },
  ],
  collections: [
    {
      label: _t('appObject.openData', { defaultMessage: 'Open data' }),
      tab: 'CollectionDataTab',
      defaultActionId: 'openTable',
    },
    {
      label: _t('appObject.openJson', { defaultMessage: 'Open JSON' }),
      tab: 'CollectionDataTab',
      defaultActionId: 'openJson',
      initialData: {
        grid: {
          isJsonView: true,
        },
      },
    },
  ],
  schedulerEvents: [
    {
      label: 'Show SQL',
      tab: 'SqlObjectTab',
      defaultActionId: 'showSql',
      icon: 'img sql-file',
    },
  ],
};
