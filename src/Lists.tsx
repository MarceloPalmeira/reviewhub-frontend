import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { type Content, api, message } from './api';
import { ConfirmDialog, EmptyState } from './components/ui';

type List = { id: string; name: string; description: string; items: Content[] };

export function ListsPage() {
  const [lists, setLists] = useState<List[] | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setLists((await api.get('/api/v1/lists')).data);
      setError('');
    } catch (e) {
      setError(message(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <div className="page-intro compact">
        <span className="section-kicker">SUA COLEÇÃO</span>
        <h1>Histórias para guardar.</h1>
        <p>Organize seus favoritos do seu jeito. Suas listas são privadas.</p>
      </div>
      <h1 className="sr-only">Minhas listas</h1>
      {error && <p role="alert">{error}</p>}
      <div className="lists-layout">
        <aside>
          <form
            className="panel form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/api/v1/lists', { name, description });
                setName('');
                setDescription('');
                await load();
              } catch (err) {
                setError(message(err));
              }
            }}
          >
            <h2>Criar lista</h2>
            <label>
              Nome da lista
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Descrição da lista
              <input
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button type="submit">Criar lista</button>
          </form>
        </aside>
        <section className="lists-collection">
          <div className="section-heading">
            <div>
              <span className="section-kicker">SEU ESPAÇO</span>
              <h2>Suas listas</h2>
            </div>
          </div>
          {lists === null ? (
            !error && <p>Carregando listas...</p>
          ) : lists.length === 0 ? (
            <EmptyState title="Você ainda não criou listas.">
              Crie uma coleção para guardar o que você ama.
            </EmptyState>
          ) : (
            lists.map((list) => (
              <ListEditor
                key={list.id}
                list={list}
                refresh={load}
                onError={setError}
              />
            ))
          )}
        </section>
      </div>
    </>
  );
}

function ListEditor({
  list,
  refresh,
  onError,
  onDeleted,
}: {
  list: List;
  refresh: () => Promise<void>;
  onError: (value: string) => void;
  onDeleted?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description);
  const update = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await refresh();
    } catch (e) {
      onError(message(e));
    }
  };
  return (
    <article className="panel list-card">
      {confirmDelete && (
        <ConfirmDialog
          title="Excluir lista?"
          description="A lista e seus itens serão removidos permanentemente."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void (async () => {
              try {
                await api.delete(`/api/v1/lists/${list.id}`);
                if (onDeleted) onDeleted();
                else await refresh();
              } catch (e) {
                onError(message(e));
              }
            })();
          }}
        />
      )}
      <span className="section-kicker">LISTA PRIVADA</span>
      <h2>{list.name}</h2>
      <Link className="section-link" to={`/listas/${list.id}`}>
        Abrir lista →
      </Link>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void update(() =>
            api.patch(`/api/v1/lists/${list.id}`, { name, description }),
          );
        }}
      >
        <label>
          Editar nome
          <input
            value={name}
            required
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Editar descrição
          <input
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="submit">Salvar lista</button>
      </form>
      {list.items.length ? (
        <ul>
          {list.items.map((item) => (
            <li key={item.id}>
              <Link to={`/conteudo/${item.id}`}>{item.title}</Link>{' '}
              <button
                type="button"
                onClick={() =>
                  void update(() =>
                    api.delete(`/api/v1/lists/${list.id}/items/${item.id}`),
                  )
                }
              >
                Remover da lista
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Esta lista ainda está vazia.</p>
      )}
      <button
        className="button-quiet danger"
        type="button"
        onClick={() => setConfirmDelete(true)}
      >
        Excluir lista
      </button>
    </article>
  );
}

export function AddToList({ contentId }: { contentId: string }) {
  const [lists, setLists] = useState<List[] | null>(null);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    api
      .get('/api/v1/lists')
      .then((r) => {
        setLists(r.data);
        if (r.data.length) setSelected(r.data[0].id);
      })
      .catch((e) => setStatus(message(e)));
  }, []);
  return (
    <section className="panel">
      <h2>Adicionar a uma lista</h2>
      {status && <output>{status}</output>}
      {lists === null ? (
        <p>Carregando listas...</p>
      ) : lists.length ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post(`/api/v1/lists/${selected}/items`, {
                content_id: contentId,
              });
              setStatus('Conteúdo adicionado à lista.');
            } catch (err) {
              setStatus(message(err));
            }
          }}
        >
          <label>
            Lista{' '}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Adicionar à lista</button>
        </form>
      ) : (
        <p>
          <Link to="/listas">Crie uma lista</Link> para adicionar este conteúdo.
        </p>
      )}
    </section>
  );
}

export function ListDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<List | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setList((await api.get(`/api/v1/lists/${id}`)).data);
    } catch (e) {
      setError(message(e));
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <>
      <Link className="back-link" to="/listas">
        ← Voltar para minhas listas
      </Link>
      <div className="page-intro compact">
        <span className="section-kicker">SUA COLEÇÃO · PRIVADA</span>
        <h1>{list?.name || 'Minha lista'}</h1>
        <p>{list?.description || 'As histórias que você escolheu guardar.'}</p>
      </div>
      {error && <p role="alert">{error}</p>}
      {list ? (
        <ListEditor
          list={list}
          refresh={load}
          onError={setError}
          onDeleted={() => navigate('/listas')}
        />
      ) : (
        !error && <p>Carregando lista...</p>
      )}
    </>
  );
}
