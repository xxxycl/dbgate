import {
  cloudSigninTokenHolder,
  currentDatabase,
  currentTheme,
  emptyConnectionGroupNames,
  extensions,
  getAppUpdaterActive,
  getCloudSigninTokenHolder,
  getExtensions,
  getVisibleToolbar,
  visibleToolbar,
  visibleWidgetSideBar,
} from '../stores';
import registerCommand from './registerCommand';
import { get } from 'svelte/store';
import AboutModal from '../modals/AboutModal.svelte';
import SettingsModal from '../settings/SettingsModal.svelte';
import SqlGeneratorModal from '../modals/SqlGeneratorModal.svelte';
import { showModal } from '../modals/modalTools';
import newQuery, { newDiagram, newPerspective, newQueryDesign } from '../query/newQuery';
import saveTabFile from '../utility/saveTabFile';
import openNewTab from '../utility/openNewTab';
import getElectron from '../utility/getElectron';
import { openElectronFile } from '../utility/openElectronFile';
import { getDefaultFileFormat } from '../plugins/fileformats';
import { getCurrentConfig, getCurrentDatabase } from '../stores';
import './recentDatabaseSwitch';
import './changeDatabaseStatusCommand';
import hasPermission from '../utility/hasPermission';
import _ from 'lodash';
import { findEngineDriver } from 'dbgate-tools';
import { openArchiveFolder } from '../utility/openArchiveFolder';
import InputTextModal from '../modals/InputTextModal.svelte';
import { removeLocalStorage } from '../utility/storageCache';
import { showSnackbarSuccess } from '../utility/snackbar';
import { apiCall } from '../utility/api';
import runCommand from './runCommand';
import { getSettings } from '../utility/metadataLoaders';
import { isMac, switchCurrentDatabase } from '../utility/common';
import { doLogout } from '../clientAuth';
import { disconnectServerConnection } from '../appobj/ConnectionAppObject.svelte';
import UploadErrorModal from '../modals/UploadErrorModal.svelte';
import ErrorMessageModal from '../modals/ErrorMessageModal.svelte';
import NewCollectionModal from '../modals/NewCollectionModal.svelte';
import ConfirmModal from '../modals/ConfirmModal.svelte';
import localforage from 'localforage';
import { openImportExportTab } from '../utility/importExportTools';
import newTable from '../tableeditor/newTable';
import { isProApp } from '../utility/proTools';
import { openWebLink } from '../utility/simpleTools';
import { _t } from '../translations';
import ExportImportConnectionsModal from '../modals/ExportImportConnectionsModal.svelte';

// function themeCommand(theme: ThemeDefinition) {
//   return {
//     text: theme.themeName,
//     onClick: () => currentTheme.set(theme.themeClassName),
//     // onPreview: () => {
//     //   const old = get(currentTheme);
//     //   currentTheme.set(css);
//     //   return ok => {
//     //     if (!ok) currentTheme.set(old);
//     //   };
//     // },
//   };
// }

registerCommand({
  id: 'theme.changeTheme',
  category: _t('command.category.theme', { defaultMessage: 'Theme' }),
  name: _t('command.theme.changeTheme.name', { defaultMessage: 'Change' }),
  toolbarName: _t('command.theme.changeTheme.toolbar', { defaultMessage: 'Change theme' }),
  onClick: () => showModal(SettingsModal, { selectedTab: 2 }),
  // getSubCommands: () => get(extensions).themes.map(themeCommand),
});

registerCommand({
  id: 'toolbar.show',
  category: _t('command.category.toolbar', { defaultMessage: 'Toolbar' }),
  name: _t('command.toolbar.show.name', { defaultMessage: 'Show' }),
  onClick: () => visibleToolbar.set(true),
  testEnabled: () => !getVisibleToolbar(),
});

registerCommand({
  id: 'toolbar.hide',
  category: _t('command.category.toolbar', { defaultMessage: 'Toolbar' }),
  name: _t('command.toolbar.hide.name', { defaultMessage: 'Hide' }),
  onClick: () => visibleToolbar.set(false),
  testEnabled: () => getVisibleToolbar(),
});

registerCommand({
  id: 'about.show',
  category: _t('command.category.about', { defaultMessage: 'About' }),
  name: _t('command.about.show.name', { defaultMessage: 'Show' }),
  toolbarName: _t('command.about.show.toolbar', { defaultMessage: 'About' }),
  onClick: () => showModal(AboutModal),
});

registerCommand({
  id: 'toggle.sidebar',
  category: _t('command.category.sidebar', { defaultMessage: 'Sidebar' }),
  name: _t('command.toggle.sidebar.name', { defaultMessage: 'Show' }),
  toolbarName: _t('command.toggle.sidebar.toolbar', { defaultMessage: 'Toggle sidebar' }),
  keyText: 'CtrlOrCommand+B',
  onClick: () => visibleWidgetSideBar.update(x => !x),
});

registerCommand({
  id: 'new.connection',
  toolbar: true,
  icon: 'icon new-connection',
  toolbarName: _t('command.new.connection.toolbar', { defaultMessage: 'Add connection' }),
  category: _t('command.category.new', { defaultMessage: 'New' }),
  toolbarOrder: 1,
  name: _t('command.new.connection.name', { defaultMessage: 'Connection' }),
  testEnabled: () => !getCurrentConfig()?.runAsPortal && !getCurrentConfig()?.storageDatabase,
  onClick: () => {
    openNewTab({
      title: _t('command.new.connection.title', { defaultMessage: 'New Connection' }),
      icon: 'img connection',
      tabComponent: 'ConnectionTab',
    });
  },
});

registerCommand({
  id: 'new.connectionOnCloud',
  toolbar: true,
  icon: 'img cloud-connection',
  toolbarName: _t('command.new.connectionOnCloud.toolbar', { defaultMessage: 'Add connection' }),
  category: _t('command.category.new', { defaultMessage: 'New' }),
  toolbarOrder: 1,
  name: _t('command.new.connectionOnCloud.name', { defaultMessage: 'Connection on Cloud' }),
  testEnabled: () =>
    !getCurrentConfig()?.runAsPortal && !getCurrentConfig()?.storageDatabase && !!getCloudSigninTokenHolder(),
  onClick: () => {
    openNewTab({
      title: _t('command.new.connectionOnCloud.title', { defaultMessage: 'New Connection on Cloud' }),
      icon: 'img cloud-connection',
      tabComponent: 'ConnectionTab',
      props: {
        saveOnCloud: true,
      },
    });
  },
});

registerCommand({
  id: 'new.connection.folder',
  toolbar: true,
  icon: 'icon add-folder',
  toolbarName: _t('command.new.connection.folder.toolbar', { defaultMessage: 'Add connection folder' }),
  category: _t('command.category.new', { defaultMessage: 'New' }),
  toolbarOrder: 1,
  name: _t('command.new.connection.folder.name', { defaultMessage: 'Connection folder' }),
  testEnabled: () => !getCurrentConfig()?.runAsPortal,
  onClick: () => {
    showModal(InputTextModal, {
      value: '',
      label: _t('command.new.connection.folder.label', { defaultMessage: 'New connection folder name' }),
      header: _t('command.new.connection.folder.header', { defaultMessage: 'Create connection folder' }),
      onConfirm: async folder => {
        emptyConnectionGroupNames.update(names => {
          if (!folder) return names;
          if (names.includes(folder)) return names;
          return [...names, folder];
        });
      },
    });
  },
});

registerCommand({
  id: 'new.query',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'icon file',
  toolbar: true,
  toolbarOrder: 2,
  name: _t('command.new.query.name', { defaultMessage: 'Query' }),
  toolbarName: _t('command.new.query.toolbar', { defaultMessage: 'New query' }),
  keyText: 'CtrlOrCommand+T',
  onClick: () => newQuery(),
});

registerCommand({
  id: 'new.shell',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img shell',
  name: _t('command.new.shell.name', { defaultMessage: 'JavaScript Shell' }),
  menuName: _t('command.new.shell.menu', { defaultMessage: 'New JavaScript shell' }),
  onClick: () => {
    openNewTab({
      title: _t('command.new.shell.title', { defaultMessage: 'Shell #' }),
      icon: 'img shell',
      tabComponent: 'ShellTab',
    });
  },
});

if (isProApp()) {
  registerCommand({
    id: 'new.queryDesign',
    category: _t('command.category.new', { defaultMessage: 'New' }),
    icon: 'img query-design',
    name: _t('command.new.queryDesign.name', { defaultMessage: 'Query design' }),
    menuName: _t('command.new.queryDesign.menu', { defaultMessage: 'New query design' }),
    onClick: () => newQueryDesign(),
    testEnabled: () =>
      getCurrentDatabase() &&
      findEngineDriver(getCurrentDatabase()?.connection, getExtensions())?.databaseEngineTypes?.includes('sql'),
  });
}

if (isProApp()) {
  registerCommand({
    id: 'new.modelTransform',
    category: _t('command.category.new', { defaultMessage: 'New' }),
    icon: 'img transform',
    name: _t('command.new.modelTransform.name', { defaultMessage: 'Model transform' }),
    menuName: _t('command.new.modelTransform.menu', { defaultMessage: 'New model transform' }),
    onClick: () => {
      openNewTab(
        {
          title: _t('command.new.modelTransform.title', { defaultMessage: 'Model transform #' }),
          icon: 'img transform',
          tabComponent: 'ModelTransformTab',
        },
        {
          editor: JSON.stringify(
            [
              {
                transform: 'dataTypeMapperTransform',
                arguments: ['json', 'nvarchar(max)'],
              },
              {
                transform: 'sqlTextReplacementTransform',
                arguments: [
                  {
                    oldval1: 'newval1',
                    oldval2: 'newval2',
                  },
                ],
              },
              {
                transform: 'autoIndexForeignKeysTransform',
                arguments: [],
              },
            ],
            null,
            2
          ),
        }
      );
    },
  });
}

if (isProApp()) {
  registerCommand({
    id: 'new.perspective',
    category: _t('command.category.new', { defaultMessage: 'New' }),
    icon: 'img perspective',
    name: _t('command.new.perspective.name', { defaultMessage: 'Perspective' }),
    menuName: _t('command.new.perspective.menu', { defaultMessage: 'New perspective' }),
    onClick: () => newPerspective(),
  });
}

registerCommand({
  id: 'new.diagram',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img diagram',
  name: _t('command.new.diagram.name', { defaultMessage: 'ER Diagram' }),
  menuName: _t('command.new.diagram.menu', { defaultMessage: 'New ER diagram' }),
  testEnabled: () =>
    getCurrentDatabase() &&
    findEngineDriver(getCurrentDatabase()?.connection, getExtensions())?.databaseEngineTypes?.includes('sql'),
  onClick: () => newDiagram(),
});

registerCommand({
  id: 'new.archiveFolder',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img archive',
  name: _t('command.new.archiveFolder.name', { defaultMessage: 'Archive folder' }),
  onClick: () => {
    showModal(InputTextModal, {
      value: '',
      label: _t('command.new.archiveFolder.label', { defaultMessage: 'New archive folder name' }),
      header: _t('command.new.archiveFolder.header', { defaultMessage: 'Create archive folder' }),
      onConfirm: async folder => {
        apiCall('archive/create-folder', { folder });
      },
    });
  },
});

registerCommand({
  id: 'new.application',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img app',
  name: _t('command.new.application.name', { defaultMessage: 'Application' }),
  onClick: () => {
    showModal(InputTextModal, {
      value: '',
      label: _t('command.new.application.label', { defaultMessage: 'New application name' }),
      header: _t('command.new.application.header', { defaultMessage: 'Create application' }),
      onConfirm: async folder => {
        apiCall('apps/create-folder', { folder });
      },
    });
  },
});

registerCommand({
  id: 'new.table',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'icon table',
  name: _t('command.new.table.name', { defaultMessage: 'Table' }),
  toolbar: true,
  toolbarName: _t('command.new.table.toolbar', { defaultMessage: 'New table' }),
  testEnabled: () => {
    const driver = findEngineDriver(get(currentDatabase)?.connection, getExtensions());
    return !!get(currentDatabase) && driver?.databaseEngineTypes?.includes('sql');
  },
  onClick: () => {
    const $currentDatabase = get(currentDatabase);
    const connection = _.get($currentDatabase, 'connection') || {};
    const database = _.get($currentDatabase, 'name');
    newTable(connection, database);
  },
});

registerCommand({
  id: 'new.collection',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'icon table',
  name: _t('command.new.collection.name', { defaultMessage: 'Collection' }),
  toolbar: true,
  toolbarName: _t('command.new.collection.toolbar', { defaultMessage: 'New collection/container' }),
  testEnabled: () => {
    const driver = findEngineDriver(get(currentDatabase)?.connection, getExtensions());
    return !!get(currentDatabase) && driver?.databaseEngineTypes?.includes('document');
  },
  onClick: async () => {
    const $currentDatabase = get(currentDatabase);
    const connection = _.get($currentDatabase, 'connection') || {};
    const database = _.get($currentDatabase, 'name');
    const driver = findEngineDriver(get(currentDatabase)?.connection, getExtensions());

    const dbid = { conid: connection._id, database };

    showModal(NewCollectionModal, {
      driver,
      dbid,
    });
  },
});

registerCommand({
  id: 'new.markdown',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img markdown',
  name: _t('command.new.markdown.name', { defaultMessage: 'Markdown page' }),
  onClick: () => {
    openNewTab({
      title: _t('command.new.markdown.title', { defaultMessage: 'Page #' }),
      icon: 'img markdown',
      tabComponent: 'MarkdownEditorTab',
    });
  },
});

if (isProApp()) {
  registerCommand({
    id: 'new.modelCompare',
    category: _t('command.category.new', { defaultMessage: 'New' }),
    icon: 'icon compare',
    name: _t('command.new.modelCompare.name', { defaultMessage: 'Compare DB' }),
    toolbar: true,
    onClick: () => {
      openNewTab({
        title: _t('command.new.modelCompare.title', { defaultMessage: 'Compare' }),
        icon: 'img compare',
        tabComponent: 'CompareModelTab',
      });
    },
  });
}

registerCommand({
  id: 'new.jsonl',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img archive',
  name: _t('command.new.jsonl.name', { defaultMessage: 'JSON Lines' }),
  menuName: _t('command.new.jsonl.menu', { defaultMessage: 'New JSON lines file' }),
  onClick: () => {
    openNewTab(
      {
        title: _t('command.new.jsonl.title', { defaultMessage: 'Lines #' }),
        icon: 'img archive',
        tabComponent: 'JsonLinesEditorTab',
      },
      {
        editor: '{"col1": "val1", "col2": "val2"}',
      }
    );
  },
});

registerCommand({
  id: 'new.sqliteDatabase',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img sqlite-database',
  name: _t('command.new.sqliteDatabase.name', { defaultMessage: 'SQLite database' }),
  menuName: _t('command.new.sqliteDatabase', { defaultMessage: 'New SQLite database' }),
  onClick: () => {
    showModal(InputTextModal, {
      value: 'newdb',
      label: _t('app.databaseName', { defaultMessage: 'Database name' }),
      header: _t('command.new.sqliteDatabase', { defaultMessage: 'New SQLite database' }),
      onConfirm: async file => {
        const resp = await apiCall('connections/new-sqlite-database', { file });
        const connection = resp;
        switchCurrentDatabase({ connection, name: `${file}.sqlite` });
      },
    });
  },
});

registerCommand({
  id: 'new.duckdbDatabase',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  icon: 'img sqlite-database',
  name: _t('command.new.duckdbDatabase.name', { defaultMessage: 'DuckDB database' }),
  menuName: _t('command.new.duckdbDatabase', { defaultMessage: 'New DuckDB database' }),
  onClick: () => {
    showModal(InputTextModal, {
      value: 'newdb',
      label: _t('app.databaseName', { defaultMessage: 'Database name' }),
      header: _t('command.new.duckdbDatabase', { defaultMessage: 'New DuckDB database' }),
      onConfirm: async file => {
        const resp = await apiCall('connections/new-duckdb-database', { file });
        const connection = resp;
        switchCurrentDatabase({ connection, name: `${file}.duckdb` });
      },
    });
  },
});

registerCommand({
  id: 'tabs.changelog',
  category: _t('command.category.tabs', { defaultMessage: 'Tabs' }),
  name: _t('command.tabs.changelog.name', { defaultMessage: 'Changelog' }),
  onClick: () => {
    openNewTab({
      title: _t('command.tabs.changelog.title', { defaultMessage: 'ChangeLog' }),
      icon: 'img markdown',
      tabComponent: 'ChangelogTab',
      props: {},
    });
  },
});

registerCommand({
  id: 'group.save',
  category: null,
  isGroupCommand: true,
  name: _t('command.group.save.name', { defaultMessage: 'Save' }),
  keyText: 'CtrlOrCommand+S',
  group: 'save',
});

registerCommand({
  id: 'group.saveAs',
  category: null,
  isGroupCommand: true,
  name: _t('command.group.saveAs.name', { defaultMessage: 'Save As' }),
  keyText: 'CtrlOrCommand+Shift+S',
  group: 'saveAs',
});

registerCommand({
  id: 'group.undo',
  category: null,
  isGroupCommand: true,
  name: _t('command.group.undo.name', { defaultMessage: 'Undo' }),
  keyText: 'CtrlOrCommand+Z',
  group: 'undo',
});

registerCommand({
  id: 'group.redo',
  category: null,
  isGroupCommand: true,
  name: _t('command.group.redo.name', { defaultMessage: 'Redo' }),
  keyText: 'CtrlOrCommand+Y',
  group: 'redo',
});

registerCommand({
  id: 'file.open',
  category: _t('command.category.file', { defaultMessage: 'File' }),
  name: _t('command.file.open.name', { defaultMessage: 'Open' }),
  keyText: 'CtrlOrCommand+O',
  testEnabled: () => getElectron() != null,
  onClick: openElectronFile,
});

registerCommand({
  id: 'file.openArchive',
  category: _t('command.category.file', { defaultMessage: 'File' }),
  name: _t('command.file.openArchive.name', { defaultMessage: 'Open DB Model/Archive' }),
  testEnabled: () => getElectron() != null,
  onClick: openArchiveFolder,
});

registerCommand({
  id: 'folder.showLogs',
  category: _t('command.category.folder', { defaultMessage: 'Folder' }),
  name: _t('command.folder.showLogs.name', { defaultMessage: 'Open logs' }),
  testEnabled: () => getElectron() != null,
  onClick: () => electron.showItemInFolder(getCurrentConfig().logsFilePath),
});

registerCommand({
  id: 'folder.showData',
  category: _t('command.category.folder', { defaultMessage: 'Folder' }),
  name: _t('command.folder.showData.name', { defaultMessage: 'Open data folder' }),
  testEnabled: () => getElectron() != null,
  onClick: () => electron.showItemInFolder(getCurrentConfig().connectionsFilePath),
});

registerCommand({
  id: 'app.resetSettings',
  category: _t('command.category.file', { defaultMessage: 'File' }),
  name: _t('command.app.resetSettings.name', { defaultMessage: 'Reset layout data & settings' }),
  testEnabled: () => true,
  onClick: () => {
    showModal(ConfirmModal, {
      message: _t('command.app.resetSettings.message', { defaultMessage: 'Really reset layout data? All opened tabs, settings and layout data will be lost. Connections and saved files will be preserved. After this, restart DbGate for applying changes.' }),
      onConfirm: async () => {
        await apiCall('config/delete-settings');
        localStorage.clear();
        await localforage.clear();
        if (getElectron()) {
          getElectron().send('reset-settings');
        } else {
          window.location.reload();
        }
      },
    });
  },
});

registerCommand({
  id: 'app.exportConnections',
  category: _t('command.category.settings', { defaultMessage: 'Settings' }),
  name: _t('command.app.exportConnections.name', { defaultMessage: 'Export connections' }),
  testEnabled: () => !getCurrentConfig()?.runAsPortal && !getCurrentConfig()?.storageDatabase,
  onClick: () => {
    showModal(ExportImportConnectionsModal, {
      mode: 'export',
    });
  },
});

registerCommand({
  id: 'app.importConnections',
  category: _t('command.category.settings', { defaultMessage: 'Settings' }),
  name: _t('command.app.importConnections.name', { defaultMessage: 'Import connections' }),
  testEnabled: () => !getCurrentConfig()?.runAsPortal && !getCurrentConfig()?.storageDatabase,
  onClick: async () => {
    const files = await electron.showOpenDialog({
      properties: ['showHiddenFiles', 'openFile'],
      filters: [
        {
          name: _t('command.app.importConnections.allSupportedFiles', { defaultMessage: 'All supported files' }),
          extensions: ['zip'],
        },
        { name: _t('command.app.importConnections.zipFiles', { defaultMessage: 'ZIP files' }), extensions: ['zip'] },
      ],
    });

    if (files?.length > 0) {
      showModal(ExportImportConnectionsModal, {
        mode: 'import',
        uploadedFilePath: files[0],
      });
    }
  },
});

registerCommand({
  id: 'file.import',
  category: _t('command.category.file', { defaultMessage: 'File' }),
  name: _t('command.file.import.name', { defaultMessage: 'Import data' }),
  toolbar: true,
  icon: 'icon import',
  onClick: () =>
    openImportExportTab(
      {
        sourceStorageType: getDefaultFileFormat(get(extensions)).storageType,
      },
      {
        importToCurrentTarget: true,
      }
    ),
  // showModal(ImportExportModal, {
  //   importToCurrentTarget: true,
  //   initialValues: { sourceStorageType: getDefaultFileFormat(get(extensions)).storageType },
  // }),
});

registerCommand({
  id: 'view.reset',
  category: _t('command.category.view', { defaultMessage: 'View' }),
  name: _t('command.view.reset.name', { defaultMessage: 'Reset view' }),
  onClick: () => {
    const keys = [
      'leftPanelWidth',
      'visibleToolbar',
      'selectedWidget',
      'currentTheme',

      'connectionsWidget',
      'pinnedItemsWidget',
      'dbObjectsWidget',

      'favoritesWidget',
      'savedFilesWidget',

      'closedTabsWidget',
      'queryHistoryWidget',

      'archiveFoldersWidget',
      'archiveFilesWidget',

      'installedPluginsWidget',
      'allPluginsWidget',

      'currentArchive',
    ];
    for (const key of keys) removeLocalStorage(key);
    showSnackbarSuccess(_t('command.view.reset.success', { defaultMessage: 'Restart DbGate (or reload on web) for applying changes' }));
  },
});

registerCommand({
  id: 'sql.generator',
  category: _t('command.category.sql', { defaultMessage: 'SQL' }),
  name: _t('command.sql.generator.name', { defaultMessage: 'SQL Generator' }),
  toolbar: true,
  icon: 'icon sql-generator',
  testEnabled: () =>
    getCurrentDatabase() != null &&
    hasPermission(`dbops/sql-generator`) &&
    findEngineDriver(getCurrentDatabase()?.connection, getExtensions())?.databaseEngineTypes?.includes('sql'),
  onClick: () =>
    showModal(SqlGeneratorModal, {
      conid: getCurrentDatabase()?.connection?._id,
      database: getCurrentDatabase()?.name,
    }),
});

registerCommand({
  id: 'database.export',
  category: _t('command.category.database', { defaultMessage: 'Database' }),
  name: _t('command.database.export.name', { defaultMessage: 'Export database' }),
  toolbar: true,
  icon: 'icon export',
  testEnabled: () => getCurrentDatabase() != null,
  onClick: () => {
    openImportExportTab({
      targetStorageType: getDefaultFileFormat(getExtensions()).storageType,
      sourceStorageType: 'database',
      sourceConnectionId: getCurrentDatabase()?.connection?._id,
      sourceDatabaseName: getCurrentDatabase()?.name,
    });
  },
});

if (isProApp()) {
  registerCommand({
    id: 'database.compare',
    category: _t('command.category.database', { defaultMessage: 'Database' }),
    name: _t('command.database.compare.name', { defaultMessage: 'Compare databases' }),
    toolbar: true,
    icon: 'icon compare',
    testEnabled: () =>
      getCurrentDatabase() != null &&
      findEngineDriver(getCurrentDatabase()?.connection, getExtensions())?.databaseEngineTypes?.includes('sql'),
    onClick: () => {
      openNewTab(
        {
          title: _t('command.database.compare.title', { defaultMessage: 'Compare' }),
          icon: 'img compare',
          tabComponent: 'CompareModelTab',
          props: {
            conid: getCurrentDatabase()?.connection?._id,
            database: getCurrentDatabase()?.name,
          },
        },
        {
          editor: {
            sourceConid: getCurrentDatabase()?.connection?._id,
            sourceDatabase: getCurrentDatabase()?.name,
            targetConid: getCurrentDatabase()?.connection?._id,
            targetDatabase: getCurrentDatabase()?.name,
          },
        }
      );
    },
  });

  registerCommand({
    id: 'database.chat',
    category: _t('command.category.database', { defaultMessage: 'Database' }),
    name: _t('command.database.chat.name', { defaultMessage: 'Database chat' }),
    toolbar: true,
    icon: 'icon ai',
    testEnabled: () =>
      getCurrentDatabase() != null &&
      findEngineDriver(getCurrentDatabase()?.connection, getExtensions())?.databaseEngineTypes?.includes('sql') &&
      hasPermission('dbops/chat'),
    onClick: () => {
      openNewTab({
        title: _t('command.database.chat.title', { defaultMessage: 'Chat' }),
        icon: 'img ai',
        tabComponent: 'DatabaseChatTab',
        props: {
          conid: getCurrentDatabase()?.connection?._id,
          database: getCurrentDatabase()?.name,
        },
      });
    },
  });
}

if (hasPermission('settings/change')) {
  registerCommand({
    id: 'settings.commands',
    category: _t('command.category.settings', { defaultMessage: 'Settings' }),
    name: _t('command.settings.commands.name', { defaultMessage: 'Keyboard shortcuts' }),
    onClick: () => {
      openNewTab({
        title: _t('command.settings.commands.title', { defaultMessage: 'Keyboard Shortcuts' }),
        icon: 'icon keyboard',
        tabComponent: 'CommandListTab',
        props: {},
      });
    },
  });

  registerCommand({
    id: 'settings.show',
    category: _t('command.category.settings', { defaultMessage: 'Settings' }),
    name: _t('command.settings.show.name', { defaultMessage: 'Change' }),
    toolbarName: _t('command.settings.show.toolbar', { defaultMessage: 'Settings' }),
    onClick: () => showModal(SettingsModal),
  });
}

registerCommand({
  id: 'cloud.logout',
  category: _t('command.category.cloud', { defaultMessage: 'Cloud' }),
  name: _t('command.cloud.logout.name', { defaultMessage: 'Logout' }),
  onClick: () => {
    cloudSigninTokenHolder.set(null);
  },
});

registerCommand({
  id: 'file.exit',
  category: _t('command.category.file', { defaultMessage: 'File' }),
  name: isMac() ? _t('command.file.exit.quit', { defaultMessage: 'Quit' }) : _t('command.file.exit.exit', { defaultMessage: 'Exit' }),
  // keyText: isMac() ? 'Command+Q' : null,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('quit-app'),
});

registerCommand({
  id: 'app.logout',
  category: _t('command.category.app', { defaultMessage: 'App' }),
  name: _t('command.app.logout.name', { defaultMessage: 'Logout' }),
  testEnabled: () => getCurrentConfig()?.isUserLoggedIn,
  onClick: doLogout,
});

registerCommand({
  id: 'app.loggedUserCommands',
  category: _t('command.category.app', { defaultMessage: 'App' }),
  name: _t('command.app.loggedUserCommands.name', { defaultMessage: 'Logged user' }),
  getSubCommands: () => {
    const config = getCurrentConfig();
    if (!config) return [];
    return [
      {
        text: _t('command.app.loggedUserCommands.logout', { defaultMessage: 'Logout' }),
        onClick: () => {
          doLogout();
        },
      },
    ];
  },
});

registerCommand({
  id: 'app.disconnect',
  category: _t('command.category.app', { defaultMessage: 'App' }),
  name: _t('command.app.disconnect.name', { defaultMessage: 'Disconnect' }),
  testEnabled: () => getCurrentConfig()?.singleConnection != null && !getCurrentConfig()?.isUserLoggedIn,
  onClick: () => disconnectServerConnection(getCurrentConfig()?.singleConnection?._id),
});

registerCommand({
  id: 'file.checkForUpdates',
  category: _t('command.category.app', { defaultMessage: 'App' }),
  name: _t('command.file.checkForUpdates.name', { defaultMessage: 'Check for updates' }),
  // testEnabled: () => true,
  testEnabled: () => getAppUpdaterActive(),
  onClick: () => getElectron().send('check-for-updates'),
});

export function registerFileCommands({
  idPrefix,
  category,
  getCurrentEditor,
  folder,
  format,
  fileExtension,
  save = true,
  execute = false,
  toggleComment = false,
  findReplace = false,
  undoRedo = false,
  executeAdditionalCondition = null,
  copyPaste = false,
}) {
  if (save) {
    registerCommand({
      id: idPrefix + '.save',
      group: 'save',
      category,
      name: _t('command.fileCommands.save.name', { defaultMessage: 'Save' }),
      // keyText: 'CtrlOrCommand+S',
      icon: 'icon save',
      toolbar: true,
      isRelatedToTab: true,
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => saveTabFile(getCurrentEditor(), 'save', folder, format, fileExtension),
    });
    registerCommand({
      id: idPrefix + '.saveAs',
      group: 'saveAs',
      category,
      name: _t('command.fileCommands.saveAs.name', { defaultMessage: 'Save As' }),
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => saveTabFile(getCurrentEditor(), 'save-as', folder, format, fileExtension),
    });
    registerCommand({
      id: idPrefix + '.saveToDisk',
      category,
      name: _t('command.fileCommands.saveToDisk.name', { defaultMessage: 'Save to disk' }),
      testEnabled: () => getCurrentEditor() != null && getElectron() != null,
      onClick: () => saveTabFile(getCurrentEditor(), 'save-to-disk', folder, format, fileExtension),
    });
  }

  if (execute) {
    registerCommand({
      id: idPrefix + '.execute',
      category,
      name: _t('command.fileCommands.execute.name', { defaultMessage: 'Execute' }),
      icon: 'icon run',
      toolbar: true,
      isRelatedToTab: true,
      keyText: 'F5 | CtrlOrCommand+Enter',
      testEnabled: () =>
        getCurrentEditor() != null &&
        !getCurrentEditor()?.isBusy() &&
        (executeAdditionalCondition == null || executeAdditionalCondition()),
      onClick: () => getCurrentEditor().execute(),
    });
    registerCommand({
      id: idPrefix + '.kill',
      category,
      name: _t('command.fileCommands.kill.name', { defaultMessage: 'Kill' }),
      icon: 'icon close',
      toolbar: true,
      isRelatedToTab: true,
      testEnabled: () => getCurrentEditor()?.canKill && getCurrentEditor().canKill(),
      onClick: () => getCurrentEditor().kill(),
    });
  }

  if (toggleComment) {
    registerCommand({
      id: idPrefix + '.toggleComment',
      category,
      name: _t('command.fileCommands.toggleComment.name', { defaultMessage: 'Toggle comment' }),
      keyText: 'CtrlOrCommand+/',
      disableHandleKeyText: 'CtrlOrCommand+/',
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => getCurrentEditor().toggleComment(),
    });
  }

  if (copyPaste) {
    registerCommand({
      id: idPrefix + '.copy',
      category,
      name: _t('command.fileCommands.copy.name', { defaultMessage: 'Copy' }),
      disableHandleKeyText: 'CtrlOrCommand+C',
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => getCurrentEditor().copy(),
    });
    registerCommand({
      id: idPrefix + '.paste',
      category,
      name: _t('command.fileCommands.paste.name', { defaultMessage: 'Paste' }),
      disableHandleKeyText: 'CtrlOrCommand+V',
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => getCurrentEditor().paste(),
    });
  }

  if (findReplace) {
    registerCommand({
      id: idPrefix + '.find',
      category,
      name: _t('command.fileCommands.find.name', { defaultMessage: 'Find' }),
      keyText: 'CtrlOrCommand+F',
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => getCurrentEditor().find(),
    });
    registerCommand({
      id: idPrefix + '.replace',
      category,
      keyText: isMac() ? 'Alt+Command+F' : 'CtrlOrCommand+H',
      name: _t('command.fileCommands.replace.name', { defaultMessage: 'Replace' }),
      testEnabled: () => getCurrentEditor() != null,
      onClick: () => getCurrentEditor().replace(),
    });
  }
  if (undoRedo) {
    registerCommand({
      id: idPrefix + '.undo',
      category,
      name: _t('command.fileCommands.undo.name', { defaultMessage: 'Undo' }),
      group: 'undo',
      icon: 'icon undo',
      testEnabled: () => getCurrentEditor()?.canUndo(),
      onClick: () => getCurrentEditor().undo(),
    });
    registerCommand({
      id: idPrefix + '.redo',
      category,
      group: 'redo',
      name: _t('command.fileCommands.redo.name', { defaultMessage: 'Redo' }),
      icon: 'icon redo',
      testEnabled: () => getCurrentEditor()?.canRedo(),
      onClick: () => getCurrentEditor().redo(),
    });
  }
}

registerCommand({
  id: 'app.minimize',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.minimize.name', { defaultMessage: 'Minimize' }),
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'minimize'),
});

registerCommand({
  id: 'app.maximize',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.maximize.name', { defaultMessage: 'Maximize' }),
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'maximize'),
});

registerCommand({
  id: 'app.toggleFullScreen',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.toggleFullScreen.name', { defaultMessage: 'Toggle full screen' }),
  keyText: 'F11',
  testEnabled: () => getElectron() != null,
  onClick: async () => {
    const settings = await getSettings();
    const value = !settings['app.fullscreen'];
    apiCall('config/update-settings', { 'app.fullscreen': value });
    if (value) getElectron().send('window-action', 'fullscreen-on');
    else getElectron().send('window-action', 'fullscreen-off');
  },
});

registerCommand({
  id: 'app.toggleDevTools',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.toggleDevTools.name', { defaultMessage: 'Toggle Dev Tools' }),
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'devtools'),
});

registerCommand({
  id: 'app.reload',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.reload.name', { defaultMessage: 'Reload' }),
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'reload'),
});

registerCommand({
  id: 'app.openDocs',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.openDocs.name', { defaultMessage: 'Documentation' }),
  onClick: () => openWebLink('https://docs.dbgate.io/'),
});

registerCommand({
  id: 'app.openWeb',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.openWeb.name', { defaultMessage: 'DbGate web' }),
  onClick: () => openWebLink('https://dbgate.io/'),
});

registerCommand({
  id: 'app.openIssue',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.openIssue.name', { defaultMessage: 'Report problem or feature request' }),
  onClick: () => openWebLink('https://github.com/dbgate/dbgate/issues/new'),
});

registerCommand({
  id: 'app.openSponsoring',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.openSponsoring.name', { defaultMessage: 'Become sponsor' }),
  testEnabled: () => !isProApp(),
  onClick: () => openWebLink('https://opencollective.com/dbgate'),
});

registerCommand({
  id: 'app.giveFeedback',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.giveFeedback.name', { defaultMessage: 'Give us feedback' }),
  onClick: () => openWebLink('https://dbgate.org/feedback'),
});

registerCommand({
  id: 'app.zoomIn',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.zoomIn.name', { defaultMessage: 'Zoom in' }),
  keyText: 'CtrlOrCommand+=',
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'zoomin'),
});

registerCommand({
  id: 'app.zoomOut',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.zoomOut.name', { defaultMessage: 'Zoom out' }),
  keyText: 'CtrlOrCommand+-',
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'zoomout'),
});

registerCommand({
  id: 'app.zoomReset',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.zoomReset.name', { defaultMessage: 'Reset zoom' }),
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'zoomreset'),
});

registerCommand({
  id: 'edit.undo',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.undo.name', { defaultMessage: 'Undo' }),
  keyText: 'CtrlOrCommand+Z',
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'undo'),
});

registerCommand({
  id: 'edit.redo',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.redo.name', { defaultMessage: 'Redo' }),
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'redo'),
});

registerCommand({
  id: 'edit.cut',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.cut.name', { defaultMessage: 'Cut' }),
  keyText: 'CtrlOrCommand+X',
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'cut'),
});

registerCommand({
  id: 'edit.copy',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.copy.name', { defaultMessage: 'Copy' }),
  keyText: 'CtrlOrCommand+C',
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'copy'),
});

registerCommand({
  id: 'edit.paste',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.paste.name', { defaultMessage: 'Paste' }),
  keyText: 'CtrlOrCommand+V',
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'paste'),
});

registerCommand({
  id: 'edit.selectAll',
  category: _t('command.category.edit', { defaultMessage: 'Edit' }),
  name: _t('command.edit.selectAll.name', { defaultMessage: 'Select All' }),
  keyText: 'CtrlOrCommand+A',
  systemCommand: true,
  testEnabled: () => getElectron() != null,
  onClick: () => getElectron().send('window-action', 'selectAll'),
});

registerCommand({
  id: 'new.gist',
  category: _t('command.category.new', { defaultMessage: 'New' }),
  name: _t('command.new.gist.name', { defaultMessage: 'Upload error to gist' }),
  onClick: () => showModal(UploadErrorModal),
});

registerCommand({
  id: 'app.unsetCurrentDatabase',
  category: _t('command.category.application', { defaultMessage: 'Application' }),
  name: _t('command.app.unsetCurrentDatabase.name', { defaultMessage: 'Unset current database' }),
  testEnabled: () => getCurrentDatabase() != null,
  onClick: () => currentDatabase.set(null),
});

const electron = getElectron();
if (electron) {
  electron.addEventListener('run-command', (e, commandId) => runCommand(commandId));
}
