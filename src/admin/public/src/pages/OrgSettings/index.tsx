import React, { useEffect, useState } from 'react';
import { useRequest, history } from 'ice';
import { Button, Icon, Table, Dialog } from '@alicloud/console-components';
import Actions, { LinkButton } from '@alicloud/console-components-actions';
import TransferOrg from './components/TransferOrg';
import { listOrgs } from '@/services/user';
import { removeOrg } from '@/services/org';
import { Toast } from '@/components/ToastContainer';
import { get } from 'lodash';
import { ROLE } from '@/constants';
import store from '@/store';
import { localStorageSet, localStorageRemove } from '@/utils';
import CreateOrg from '@/pages/CreateOrg';

function Orgs({
  match: {
    params: { orgName },
  },
}) {
  const { data, request, refresh, loading } = useRequest(listOrgs);
  const [userState] = store.useModel('user');
  const username = get(userState, 'userInfo.username');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    request();
  }, []);

  const handleDelete = (record) => {
    const dialog = Dialog.alert({
      title: `删除团队：${record.name}`,
      content: '您确定删除当前团队吗?',
      onOk: async () => {
        const { success } = await removeOrg({ orgName: record.name });
        if (success) {
          Toast.success('团队删除成功');
          localStorageRemove(record.user_id);
          refresh();
          history?.push(`/${orgName}/profile/organizations?orgRefresh=${new Date().getTime()}`);
        }
        dialog.hide();
      },
    });
  };

  const handleChangeOrg = async (record) => {
    localStorageSet(record.user_id, record.name);
    history?.push(`/${record.name}/setting/org`);
  };

  const columns = [
    {
      title: '团队地址',
      key: 'name',
      dataIndex: 'name',
      cell: (value, _index, record) => (
        <Button type="primary" text onClick={() => handleChangeOrg(record)}>
          {value}
        </Button>
      ),
    },
    {
      title: '团队名称',
      key: 'alias',
      dataIndex: 'alias',
      cell: (value, _index, record) => value || record.name,
    },
    {
      title: '角色',
      key: 'role',
      dataIndex: 'role',
    },
    {
      title: '描述',
      key: 'description',
      dataIndex: 'description',
    },
    {
      title: '操作',
      cell: (value, _index, record) => (
        <Actions>
          <LinkButton type="primary" onClick={() => handleChangeOrg(record)}>
            切换
          </LinkButton>
          <TransferOrg callback={refresh} dataSource={{ name: record.name }}>
            <LinkButton disabled={record.role !== ROLE.OWNER || record.name === username}>
              转让
            </LinkButton>
          </TransferOrg>
          <LinkButton
            type="primary"
            disabled={record.role !== ROLE.OWNER || record.name === username}
            onClick={() => handleDelete(record)}
          >
            删除
          </LinkButton>
        </Actions>
      ),
    },
  ];

  const handleCreateOrgCallback = () => {
    setVisible(false);
    return refresh();
  };

  return (
    <div className="mt-16">
      <div className="flex-r mb-16">
        <Button type="primary" onClick={() => setVisible(true)}>
          新建团队
        </Button>
        <Button onClick={refresh}>
          <Icon type="refresh" />
        </Button>
      </div>
      <Table
        loading={loading}
        hasBorder={false}
        dataSource={get(data, 'result')}
        columns={columns}
      />
      <CreateOrg
        callback={handleCreateOrgCallback}
        active={visible}
        orgName={orgName}
        changeVisible={(val) => setVisible(val)}
      />
    </div>
  );
}
export default Orgs;
