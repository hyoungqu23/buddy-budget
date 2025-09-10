import {
  createCategory,
  deleteCategory,
  listInfiniteCategories,
  updateCategory,
} from '@/app/actions/categories';
import CategoriesClient from './CategoriesClient';

const CategoriesSettingsPage = async ({ params }: { params: { slug: string } }) => {
  const slug = params.slug;
  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>카테고리</h2>
      <CategoriesClient
        slug={slug}
        actions={{
          listAction: listInfiniteCategories,
          createAction: createCategory,
          updateAction: updateCategory,
          deleteAction: deleteCategory,
        }}
      />
    </div>
  );
};

export default CategoriesSettingsPage;
