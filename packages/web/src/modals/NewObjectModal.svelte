<script lang="ts">
  import NewObjectButton from '../buttons/NewObjectButton.svelte';
  import runCommand from '../commands/runCommand';
  import newQuery from '../query/newQuery';
  import { commandsCustomized, selectedWidget } from '../stores';
  import { isProApp } from '../utility/proTools';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal } from './modalTools';
  import { _t } from '../translations';

  export let multiTabIndex = undefined;

  let NEW_ITEMS = [
    {
      icon: 'icon sql-file',
      colorClass: 'color-icon-blue',
      title: _t('newObjectModal.query', { defaultMessage: 'Query' }),
      description: _t('newObjectModal.sqlQueryEditor', { defaultMessage: 'SQL query editor' }),
      action: () => {
        newQuery({ multiTabIndex });
      },
      testid: 'NewObjectModal_query',
    },
    {
      icon: 'icon connection',
      colorClass: 'color-icon-yellow',
      title: _t('newObjectModal.connection', { defaultMessage: 'Connection' }),
      description: _t('newObjectModal.databaseConnectionLocal', { defaultMessage: 'Database connection stored locally' }),
      command: 'new.connection',
      changeWidget: 'database',
      testid: 'NewObjectModal_connection',
      disabledMessage: _t('newObjectModal.notAllowedCreateConnections', { defaultMessage: 'You are not allowed to create new connections' }),
    },
    {
      icon: 'icon cloud-connection',
      colorClass: 'color-icon-blue',
      title: _t('newObjectModal.connectionOnCloud', { defaultMessage: 'Connection on Cloud' }),
      description: _t('newObjectModal.databaseConnectionCloud', { defaultMessage: 'Database connection stored on DbGate Cloud' }),
      command: 'new.connectionOnCloud',
      changeWidget: 'cloud-private',
      testid: 'NewObjectModal_connectionOnCloud',
      disabledMessage: _t('newObjectModal.needLoginForCloud', { defaultMessage: 'For creating connections on DbGate Cloud, you need to be logged in' }),
    },
    {
      icon: 'icon query-design',
      colorClass: 'color-icon-red',
      title: _t('newObjectModal.queryDesigner', { defaultMessage: 'Query Designer' }),
      description: _t('newObjectModal.designSqlQueriesVisually', { defaultMessage: 'Design SQL queries visually' }),
      command: 'new.queryDesign',
      testid: 'NewObjectModal_queryDesign',
      disabledMessage: _t('newObjectModal.queryDesignerNotAvailable', { defaultMessage: 'Query Designer is not available for current database' }),
      isProFeature: true,
    },
    {
      icon: 'icon diagram',
      colorClass: 'color-icon-blue',
      title: _t('newObjectModal.erDiagram', { defaultMessage: 'ER Diagram' }),
      description: _t('newObjectModal.visualizeDatabaseStructure', { defaultMessage: 'Visualize database structure' }),
      command: 'new.diagram',
      testid: 'NewObjectModal_diagram',
      disabledMessage: _t('newObjectModal.erDiagramNotAvailable', { defaultMessage: 'ER Diagram is not available for current database' }),
    },
    {
      icon: 'icon perspective',
      colorClass: 'color-icon-yellow',
      title: _t('newObjectModal.perspective', { defaultMessage: 'Perspective' }),
      description: _t('newObjectModal.joinComplexDataMultipleDatabases', { defaultMessage: 'Join complex data from multiple databases' }),
      command: 'new.perspective',
      testid: 'NewObjectModal_perspective',
      isProFeature: true,
    },
    {
      icon: 'icon table',
      colorClass: 'color-icon-blue',
      title: _t('newObjectModal.table', { defaultMessage: 'Table' }),
      description: _t('newObjectModal.createTableCurrentDatabase', { defaultMessage: 'Create table in the current database' }),
      command: 'new.table',
      testid: 'NewObjectModal_table',
      disabledMessage: _t('newObjectModal.tableCreationNotAvailable', { defaultMessage: 'Table creation is not available for current database' }),
    },
    {
      icon: 'icon sql-generator',
      colorClass: 'color-icon-green',
      title: _t('newObjectModal.sqlGenerator', { defaultMessage: 'SQL Generator' }),
      description: _t('newObjectModal.generateSqlScripts', { defaultMessage: 'Generate SQL scripts for database objects' }),
      command: 'sql.generator',
      testid: 'NewObjectModal_sqlGenerator',
      disabledMessage: _t('newObjectModal.sqlGeneratorNotAvailable', { defaultMessage: 'SQL Generator is not available for current database' }),
    },
    {
      icon: 'icon export',
      colorClass: 'color-icon-green',
      title: _t('newObjectModal.exportDatabase', { defaultMessage: 'Export database' }),
      description: _t('newObjectModal.exportToFile', { defaultMessage: 'Export to file like CSV, JSON, Excel, or other DB' }),
      command: 'database.export',
      testid: 'NewObjectModal_databaseExport',
      disabledMessage: _t('newObjectModal.exportNotAvailable', { defaultMessage: 'Export is not available for current database' }),
    },
    {
      icon: 'icon compare',
      colorClass: 'color-icon-red',
      title: _t('newObjectModal.compareDatabase', { defaultMessage: 'Compare database' }),
      description: _t('newObjectModal.compareDatabaseSchemas', { defaultMessage: 'Compare database schemas' }),
      command: 'database.compare',
      testid: 'NewObjectModal_databaseCompare',
      disabledMessage: _t('newObjectModal.databaseComparisonNotAvailable', { defaultMessage: 'Database comparison is not available for current database' }),
      isProFeature: true,
    },
    {
      icon: 'icon ai',
      colorClass: 'color-icon-blue',
      title: _t('newObjectModal.databaseChat', { defaultMessage: 'Database Chat' }),
      description: _t('newObjectModal.chatWithDatabaseUsingAi', { defaultMessage: 'Chat with your database using AI' }),
      command: 'database.chat',
      isProFeature: true,
      disabledMessage: _t('newObjectModal.databaseChatNotAvailable', { defaultMessage: 'Database chat is not available for current database' }),
      testid: 'NewObjectModal_databaseChat',
    }
  ];
</script>

<ModalBase simplefix {...$$restProps}>
  <div class="create-header">{_t('newObjectModal.createNew', { defaultMessage: 'Create new' })}</div>
  <div class="wrapper">
    {#each NEW_ITEMS as item}
      {@const enabled = item.command ? $commandsCustomized[item.command]?.enabled : true}
      <NewObjectButton
        icon={item.icon}
        title={item.title}
        description={item.description}
        {enabled}
        colorClass={item.colorClass}
        data-testid={item.testid}
        disabledMessage={item.disabledMessage}
        isProFeature={item.isProFeature}
        on:click={() => {
          if (!enabled) return;
          closeCurrentModal();
          if (item.action) {
            item.action();
          } else if (item.command) {
            runCommand(item.command);
          }
          if (item.changeWidget) {
            $selectedWidget = item.changeWidget;
          }
        }}
      />
    {/each}
  </div>
</ModalBase>

<style>
  .wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: center;
    padding: 20px;
  }
  .create-header {
    text-transform: uppercase;
    color: var(--theme-font-3);
    font-size: 150%;
    text-align: center;
  }
</style>
