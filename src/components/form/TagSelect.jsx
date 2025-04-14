import { useState, useEffect } from 'react';
import CreatableSelect from './CreatableSelect';
import { useTags, useCreateTag } from '../../hooks/react-query/tags/useTags';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiPriceTag3Line } from 'react-icons/ri';
import { Spinner } from '@heroui/react';

const TagSelect = ({
    label = 'Tag',
    placeholder = 'Search tags...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    disabled = false,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: tags, isLoading } = useTags(currentWorkspace);
    const { mutateAsync: createTag } = useCreateTag(currentWorkspace);
    const [selectedTags, setSelectedTags] = useState([]);

    // Convert tags to options format for CreatableSelect
    const tagOptions = tags
        ? tags.map((tag) => ({
              label: tag.name,
              value: tag.id,
          }))
        : [];

    // Handle tag creation
    const handleCreateTag = async (tagName) => {
        // Create a new tag in the database
        const newTag = await createTag({
            tag: {
                name: tagName,
                workspace_id: currentWorkspace?.workspace_id,
            },
        });

        const mappedNew = {
            label: tagName,
            value: newTag.id,
        };

        // For multiple selection, we don't need to call onChange here
        // as it will be called by CreatableSelect

        return mappedNew;
    };

    // Process default values
    useEffect(() => {
        if (defaultValue) {
            // For multiple selection, defaultValue should be an array of IDs
            if (Array.isArray(defaultValue)) {
                setSelectedTags(defaultValue);
            } else {
                // If a single value is provided, convert it to an array
                setSelectedTags([defaultValue]);
            }
        }
    }, [defaultValue]);

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={tagOptions}
            defaultValue={
                Array.isArray(defaultValue)
                    ? defaultValue
                          .map((id) => tagOptions?.find((opt) => opt.value === id))
                          .filter(Boolean)
                    : defaultValue
                      ? [tagOptions?.find((opt) => opt.value === defaultValue)].filter(Boolean)
                      : []
            }
            onChange={(value) => {
                if (onChange) {
                    // For multiple selection, value is an array of IDs
                    setSelectedTags(value);
                    onChange(value);
                }
            }}
            onCreate={handleCreateTag}
            placement={placement}
            className={className}
            disabled={disabled}
            icon={<RiPriceTag3Line fontSize="1rem" />}
            multiple
        />
    );
};

export default TagSelect;
