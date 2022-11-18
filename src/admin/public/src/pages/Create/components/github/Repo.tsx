import React, { useEffect, ReactNode, useState } from 'react';
import { useRequest } from 'ice';
import { Select, Icon, Field } from '@alicloud/console-components';
import store from '@/store';
import { noop, map, find, isEmpty } from 'lodash';
import RefreshIcon from '@/components/RefreshIcon';
import { githubOrgs, githubOrgRepos } from '@/services/git';

export interface IRepoItem {
  name: string;
  owner: string;
  avatar_url: string;
  private: boolean;
  label: string | ReactNode;
  value: string;
  disabled: boolean;
  url: string;
  default_branch: string;
}

interface IProps {
  field: Field;
  value?: IRepoItem | undefined;
  onChange?: (value: IRepoItem) => void;
}

const initRepoTypeList = [
  {
    label: '个人仓库',
    children: [{
      value: 'personal',
      label: '个人仓库'
    }]
  },
  {
    label: '组织仓库',
    children: []
  },
]

const Repos = (props: IProps) => {
  const { value, onChange = noop, field } = props;
  const { data, loading, request } = useRequest(githubOrgs);
  const orgRepos = useRequest(githubOrgRepos);
  const [userState, userDispatchers] = store.useModel('user');
  const effectsState = store.useModelEffectsState('user');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [repoTypeList, setRepoTypeList] = useState(initRepoTypeList);
  const [currentRepoType, setCurrentRepoType] = useState('personal');
  const { getValue, setValue } = field;

  useEffect(() => {
    if (!isEmpty(data)) {
      const { data: orgs } = data;
      const orgList = map(orgs, ({ org, id }) => ({ label: org, value: org, id }))
      repoTypeList[1].children = orgList as any;
      setRepoTypeList([...repoTypeList])
    }
  }, [data])

  useEffect(() => {
    onRepoTypeChange('personal')
  }, [userState.isAuth]);

  useEffect(() => {
    request();
  }, [])

  const valueRender = ({ value }) => {
    const userRepos = getValue('userRepos') as IRepoItem[] || [] as IRepoItem[]
    const item = find(userRepos, (obj: IRepoItem) => obj.name === value);
    if (!item) return null;
    return (
      <div className="align-center">
        {item.avatar_url && (
          <img
            className="mr-4"
            src={item.avatar_url}
            style={{ width: 20, height: 20, borderRadius: '50%' }}
          />
        )}
        {`${item.owner}/${item.name}`}
      </div>
    );
  };

  const goDetail = (e, item: IRepoItem) => {
    e.stopPropagation();
    window?.open(item.url);
  };

  const fetchUserRepos = async () => {
    if (!userState.isAuth) return;
    const res = await userDispatchers.getUserRepos();
    const data = map(res, (item: IRepoItem) => {
      return {
        ...item,
        label: (
          <div className="flex-r">
            <div className="align-center">
              {item.avatar_url && (
                <img
                  className="ml-4"
                  src={item.avatar_url}
                  style={{ width: 20, height: 20, borderRadius: '50%' }}
                />
              )}
              <span className="ml-4">{`${item.owner}/${item.name}`}</span>
              <Icon
                className="ml-4 mr-4"
                style={{ color: item.disabled ? '#b3b3b3' : '#666' }}
                size={12}
                type={item.private ? 'lock' : 'unlock'}
              />
            </div>
            <div
              style={{ color: '#0064C8' }}
              className="cursor-pointer"
              onClick={(e) => goDetail(e, item)}
            >
              <span>详情</span>
              <Icon className="ml-4" type="external-link" size={12} />
            </div>
          </div>
        ),
        value: item.name,
      };
    });
    setValue('userRepos', data);
  };

  const fetchOrgRepos = async (org) => {
    if (!userState.isAuth) return;
    const { data: res } = await orgRepos.request({ org });
    const data = map(res, (item: IRepoItem) => {
      return {
        ...item,
        label: (
          <div className="flex-r">
            <div className="align-center">
              {item.avatar_url && (
                <img
                  className="ml-4"
                  src={item.avatar_url}
                  style={{ width: 20, height: 20, borderRadius: '50%' }}
                />
              )}
              <span className="ml-4">{`${item.owner}/${item.name}`}</span>
              <Icon
                className="ml-4 mr-4"
                style={{ color: item.disabled ? '#b3b3b3' : '#666' }}
                size={12}
                type={item.private ? 'lock' : 'unlock'}
              />
            </div>
            <div
              style={{ color: '#0064C8' }}
              className="cursor-pointer"
              onClick={(e) => goDetail(e, item)}
            >
              <span>详情</span>
              <Icon className="ml-4" type="external-link" size={12} />
            </div>
          </div>
        ),
        value: item.name,
      };
    });
    setValue('userRepos', data);
  };

  const refresh = async () => {
    setRefreshLoading(true);
    await request()
    if (currentRepoType === 'personal') {
      await fetchUserRepos();
    } else {
      await fetchOrgRepos(currentRepoType)
    }
    setRefreshLoading(false);
  };

  const handleChange = (value: string) => {
    const item = find(getValue('userRepos'), (obj: IRepoItem) => obj.value === value);
    onChange(item);
  };
  const onRepoTypeChange = (value) => {
    if (!value) return;
    if (value === 'personal') {
      fetchUserRepos()
    } else {
      fetchOrgRepos(value)
    }
    setCurrentRepoType(value);
    onChange({});
  }
  return (
    <div className='flex-r position-r'>
      <Select
        style={{ flexBasis: '30%' }}
        placeholder="请选择个人/组织"
        dataSource={repoTypeList}
        defaultValue={'personal'}
        state={loading ? 'loading' : undefined}
        disabled={loading}
        onChange={onRepoTypeChange}
      />
      <Select
        style={{ flexBasis: '68%' }}
        className="full-width"
        placeholder="请选择"
        showSearch
        dataSource={getValue('userRepos')}
        state={(orgRepos.loading || effectsState.getUserRepos.isLoading) ? 'loading' : undefined}
        disabled={loading || effectsState.getUserRepos.isLoading || orgRepos.loading}
        value={value?.name}
        onChange={handleChange}
        valueRender={valueRender}
        popupClassName="icon-right"
      />
      <RefreshIcon
        style={{ position: 'absolute', right: -20 }}
        refreshCallback={refresh}
        loading={refreshLoading}
      />
    </div>
  );
};

export default Repos;