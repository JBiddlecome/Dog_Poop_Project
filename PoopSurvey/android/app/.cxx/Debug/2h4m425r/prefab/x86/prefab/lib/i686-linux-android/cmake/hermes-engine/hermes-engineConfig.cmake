if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/jakeb/.gradle/caches/8.13/transforms/14d040535af0397c8381d59e9d08b0bc/transformed/hermes-android-0.14.1-debug/prefab/modules/hermesvm/libs/android.x86/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/jakeb/.gradle/caches/8.13/transforms/14d040535af0397c8381d59e9d08b0bc/transformed/hermes-android-0.14.1-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

